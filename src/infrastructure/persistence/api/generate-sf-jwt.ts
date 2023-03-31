import jwt from 'jsonwebtoken';
import { createPublicKey, createHash, createPrivateKey } from 'crypto';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { appConfig } from '../../../config';

const client = new S3Client({
  region: appConfig.cloud.region,
});

const readPrivateKey = async (
  passphrase: string,
  keyname: string
): Promise<string> => {
  const input = {
    Bucket: appConfig.snowflake.privateKeyConfig.bucketName,
    Key: keyname,
  };
  const command = new GetObjectCommand(input);
  const response = await client.send(command);

  const {
    Body: body,
    ServerSideEncryption: serverSideEncryption,
    $metadata: metadata,
  } = response;

  if (metadata.httpStatusCode !== 200)
    throw new Error('Problem ocurred while retrieving key');
  if (!body) throw new Error('No key found');

  if (serverSideEncryption !== 'AES256')
    throw new Error(
      'Object is encrypted with server-side encryption other than SSE-S3'
    );

  const encryptedPrivateKey = await body.transformToString();

  const privateKey = createPrivateKey({
    key: Buffer.from(encryptedPrivateKey),
    format: 'pem',
    passphrase,
  });

  const decryptedPrivateKey = privateKey.export({
    format: 'pem',
    type: 'pkcs8',
  });

  return Buffer.isBuffer(decryptedPrivateKey)
    ? decryptedPrivateKey.toString()
    : decryptedPrivateKey;
};

const generateSfJwt = async (
  passphrase: string,
  accountId: string,
  username: string,
  keyname: string
): Promise<string> => {
  const privateKey = await readPrivateKey(passphrase, keyname);

  const publicKeyObject = createPublicKey({
    key: privateKey,
    format: 'pem',
  });
  const publicKey = publicKeyObject.export({ format: 'der', type: 'spki' });
  const publicKeyFingerprint = `SHA256:${createHash('sha256')
    .update(publicKey)
    .digest('base64')}`;

  const signOptions = {
    iss: `${accountId}.${username}.${publicKeyFingerprint}`,
    sub: `${accountId}.${username}`,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };

  const token = jwt.sign(signOptions, privateKey, { algorithm: 'RS256' });

  return token;
};

export default generateSfJwt;
