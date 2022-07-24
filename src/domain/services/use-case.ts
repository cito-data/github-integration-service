export default interface IUseCase<IRequest, IResponse, IAuth, IDbConnection = undefined, IDbEncryption = undefined> {
  execute(request: IRequest, auth: IAuth, dbConnection: IDbConnection, dbEncryption: IDbEncryption): Promise<IResponse> | IResponse;
  // eslint-disable-next-line semi
}