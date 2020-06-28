const Responses = require('../common/API_Responses');
const Dynamo = require('../common/Dynamo');
const WS = require('../common/WebsocketMessage');

const tableName = 'WebsocketUsers';

exports.handler = async event => {
    console.log('event' + event);

    const {connectionId: connectionID} = event.requestContext;

    const body = JSON.parse(event.body);

    try{
        // send message to other opponent
        if(body.method === 'init'){
            const senderRecord = await Dynamo.get(connectionID, tableName);
            const oppositionRecord = await Dynamo.get(senderRecord.opponentId, tableName);
            const {domainName, stage, ID, side} = oppositionRecord;

            await WS.send({
                domainName,
                stage,
                connectionID: ID,
                message: JSON.stringify({
                    foundOpponent: true,
                    side,
                }),
            });
        }
        return Responses._200({message: "received message"});
    }catch(error){
        return Responses._400({message: "Message could not be received."})
    }
}