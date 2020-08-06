const Responses = require('../common/API_Responses');
const Dynamo = require('../common/Dynamo');
const WS = require('../common/WebsocketMessage');

const tableName = 'WebsocketUsers';

exports.handler = async event => {
    console.log('event' + event);

    const {connectionId: connectionID, domainName, stage,} = event.requestContext;

    const data = {
        ID: connectionID,
        messages: [],
        domainName,
        stage,
        opponentId: "",
        foundOpponent: false,
        side: (Math.floor(Math.random()*100000) % 2),
        remainingTime: 180000,
    };

    // scan table
    const scanData = await Dynamo.scan({
        TableName: tableName,
        FilterExpression: "foundOpponent = :fo",
        ExpressionAttributeValues: {
            ":fo": false,
        }
    });
    
    
    if(scanData.Count === 0){ // no users in ddb or all players are paired
        await Dynamo.write(data, tableName);
    } else { // pairing opponents
        const randomOpponent = scanData.Items[Math.floor(Math.random() * scanData.Items.length)];
        // update old
        await Dynamo.update({
            TableName: tableName,
            Key: {
                ID: String(randomOpponent.ID),
            },
            UpdateExpression: "set opponentId = :id, foundOpponent = :fo",
            ExpressionAttributeValues: {
                ":id": String(connectionID),
                ":fo": true,
            },
            ReturnValues: "UPDATED_NEW"
        });

        // create opposite side
        const playerSide = (randomOpponent.side === 1) ? 0 : 1;

        // write new opponent
        await Dynamo.write({
            ID: connectionID,
            messages: [],
            domainName,
            stage,
            opponentId: randomOpponent.ID,
            foundOpponent: true,
            side: playerSide,
            init: false,
            remainingTime: 180000,
        }, tableName);

        // send messages former player
        await WS.send({
            domainName: randomOpponent.domainName, 
            stage: randomOpponent.stage,
            connectionID: randomOpponent.ID, 
            message: JSON.stringify({
                foundOpponent: true,
                side: randomOpponent.side,
                method: 'init',
            }),
        });
    }

    return Responses._200({message: "connected"});
}