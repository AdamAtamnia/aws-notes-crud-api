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

exports.handler = (event, context, callback) => {
  // by default the token will be taken from authorization in the header
  const token = event.authorizationToken // "allow" or "deny"
  switch (token) {
    case "allow":
      callback(null, generatePolicy("user", "Allow", event.methodArn)) // api gateway gives this as arn of the incomming method request
      break;
    case "deny":
      callback(null, generatePolicy("user", "Deny", event.methodArn)) 
      break;
    default:
      callback("Error: Invalid token") 
      break;
  }
}