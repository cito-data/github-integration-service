import Dbo from './db/mongo-db';
import { citoMaterializationNames } from '../../domain/services/snowflake-materialization-creation-model';
import { appConfig } from '../../config';


export default class CreateCitoSnowflakeEnvRepo {

    createCollections = async (
        dbo: Dbo,
        callerOrgId: string
    ): Promise<void> => {
        const clientConnection = await dbo.client.connect();
        const userEnvConnection = clientConnection.db(appConfig.mongodb.userEnvDbName);

        citoMaterializationNames.map(async (type) => {
            await userEnvConnection.createCollection(`${type}_${callerOrgId}`)
              .then()
              .catch((error) => {
                console.log(`Could not create collection ${type}: ${error}`);
              });
        });
    };
}