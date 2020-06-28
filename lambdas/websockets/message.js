const Responses = require('../common/API_Responses');
const Dynamo = require('../common/Dynamo');
const WS = require('../common/WebsocketMessage');

const tableName = 'WebsocketUsers';

exports.handler = async event => {
    console.log('event' + event);

    const {connectionId: connectionID} = event.requestContext;

    const body = JSON.parse(event.body);

    try{
        const record = await Dynamo.get(connectionID, tableName);
        const {messages, domainName, stage} = record;
        messages.push(body.message);
        const data = {
            ...record,
            messages
        };
        await Dynamo.write(data, tableName);

        await WS.send({domainName, stage, connectionID, message: "This is a reply."});

        return Responses._200({message: "received message"});
    }catch(error){
        return Responses._400({message: "Message could not be received."})
    }
}