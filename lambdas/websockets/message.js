const Responses = require('../common/API_Responses');
const Dynamo = require('../common/Dynamo');

const tableName = 'WebsocketUsers';

exports.handler = async event => {
    console.log('event' + event);

    const {connectionId: connectionID} = event.requestContext;

    const body = JSON.parse(event.body);

    try{
        const record = await Dynamo.get(connectionID, tableName);
        const messages = record.messages;
        messages.push(body.message);
        const data = {
            ...record,
            messages
        };
        await Dynamo.write(data, tableName);

        return Responses._200({message: "received message"});
    }catch(error){
        return Responses._400({message: "Message could not be received."})
    }
}