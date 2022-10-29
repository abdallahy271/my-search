export enum Sender {
    React,
    Content,
    FlaskAdd,
    FlaskSearch,
    GetUserAuth,
    GetVisitedSite
}

export interface ChromeMessage {
    from: Sender,
    message: any
}
