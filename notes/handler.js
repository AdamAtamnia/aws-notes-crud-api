'use strict';
const DynamoDB = require("aws-sdk/clients/dynamodb")
const documentClient = new DynamoDB.DocumentClient({ 
  region: 'us-east-1',
  maxRetries: 3,
  httpOptions: {
    timeout: 5000, // after 5 seconds it will timeout
  }
})

const NOTES_TABLE_NAME = process.env.NOTES_TABLE_NAME

// helper function to reduce code duplication (not used)
const makeSendObj = (statusCode, data) => {
  return {
    statusCode: statusCode, 
    body: JSON.stringify(data)
  }
} 

// google dynamodb javascript sdk
// user DocumentClient as it abstracts crud
// code in the lambda
module.exports.createNote = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false // (to reduce latency) this allows the message to be sent even if callbackloop in nodejs is not empty (it stops the events)
  const data = JSON.parse(event.body)
  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
      Item: {
        notesId: data.id, // HashKey: 'haskey',
        title: data.title,
        body: data.body
      },
      ConditionExpression: "attribute_not_exists(notesId)" // make sure no item has already the same attribute value for this attribute, else fail and throw error
    }
    // http keep alive to reuse connections between lambda and Database
    await documentClient.put(params).promise();
    callback(null, {
      statusCode: 201, //201 shows: ok + something created
      body: JSON.stringify(data),
    }) // we use this instead of return so we can await the promise before sending a responce
  } catch (error) {
    callback(null, {
      statusCode: 500, 
      body: JSON.stringify(error.message),
    })
  }
};

module.exports.updateNote = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false
  const notesId = event.pathParameters.id;
  let data = JSON.parse(event.body)
  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
      Key: { notesId: notesId }, // shorthand: Key: { notesId }
      UpdateExpression: "set #title = :title, #body = :body",
      // why use varibales: their are reserved words in update expression: using place variables is safer
      ExpressionAttributeNames: { 
        "#title" : "title",
        "#body" : "body"
      },
      ExpressionAttributeValues: { 
        ":title" : data.title,
        ":body" : data.body
      },
      ConditionExpression: "attribute_exists(notesId)" // make sure item is available in the table

    }
    await documentClient.update(params).promise();
    callback(null, {
      statusCode: 200, 
      body: JSON.stringify(data),
    })
  } catch (error) {
    callback(null, {
      statusCode: 500, 
      body: JSON.stringify(error.message),
    })
  }
};

module.exports.deleteNote = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false
  const notesId = event.pathParameters.id;
  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
      Key: { notesId },
      ConditionExpression: "attribute_exists(notesId)"
    }
    await documentClient.delete(params).promise();
    callback(null, {
      statusCode: 200, 
      body: notesId,
    })
  } catch (error) {
    callback(null, {
      statusCode: 500, 
      body: JSON.stringify(error.message),
    })
  }
};

module.exports.getAllNotes = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false
  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
    }
    const notes = await documentClient.scan(params).promise();
    callback(null, {
      statusCode: 200, 
      body: JSON.stringify(notes),
    })
  } catch (error) {
    callback(null, {
      statusCode: 500, 
      body: JSON.stringify(error.message),
    })
  }
};