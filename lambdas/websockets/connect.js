const Responses = require('../common/API_Responses');
const Dynamo = require('../common/Dynamo');

const tableName = 'WebsocketUsers';

exports.handler = async event => {
    console.log('event' + event);

    const {connectionId: connectionID} = event.requestContext;

    const data = {
        ID: connectionID,
        data: Date.now(),
        messages: [],
    }

    await Dynamo.write(data, tableName);

    return Responses._200({message: "connected"});
}