const { CognitoJwtVerifier } = require("aws-jwt-verify")
const COGNITO_USERPOOL_ID = process.env.COGNITO_USERPOOL_ID
const COGNITO_WEB_CLIENT_ID = process.env.COGNITO_WEB_CLIENT_ID


const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: COGNITO_USERPOOL_ID,
  tokenUse: "id", // type of token (for us is id token) id or access
  clientId: COGNITO_WEB_CLIENT_ID, // client id of the userpool client: used to interact with the user pool and perform actions such as user authentication and authorization.
})

const generatePolicy = (principalId, effect, resource) => {
  const authResponse = {}

  authResponse.principalId = principalId

  if(effect && resource){
    const policyDocument = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: effect,
          Resource: resource,
          Action: "execute-api:Invoke"
        }
      ]
    }
    authResponse.policyDocument = policyDocument
  }

  // add extra info if needed we can do whatever we want (we can even make db calls to get extra info abou the user and send it down)
  authResponse.context = {
    foo: "bar"
  }
  console.log(JSON.stringify(authResponse)) // so we can see log in cloud watch
  return authResponse
}

exports.handler = async (event, context, callback) => {
  // by default the token will be taken from authorization in the header
  const token = event.authorizationToken 
  console.log(token)
  try {
    const payload = await jwtVerifier.verify(token)
    console.log(JSON.stringify(payload))

    callback(null, generatePolicy("user", "Allow", event.methodArn))
  } catch (error) {
    callback("Error: Invalid token")
  }
  
}


// OLD EXERCISE
// exports.handler = (event, context, callback) => {
//   // by default the token will be taken from authorization in the header
//   const token = event.authorizationToken // "allow" or "deny", normal this is a jwt token
//   switch (token) {
//     case "allow":
//       callback(null, generatePolicy("user", "Allow", event.methodArn)) // api gateway gives this as arn of the incomming method request
//       break;
//     case "deny":
//       callback(null, generatePolicy("user", "Deny", event.methodArn)) 
//       break;
//     default:
//       callback("Error: Invalid token") 
//       break;
//   }
// }