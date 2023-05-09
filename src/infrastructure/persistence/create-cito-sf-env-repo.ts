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

        await Promise.all(citoMaterializationNames.map(async (type) => {
            try {
                await userEnvConnection.createCollection(`${type}_${callerOrgId}`);
            } catch (error) {
                console.log(`Could not create collection ${type}: ${error}`);
            }
        }));
    };
}