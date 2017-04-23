## Authentication
### Before creating a user, an organization must exist:
`PUT /organization` with body containing:  
```JSON
{
  "name": "Name of Organization"
}
```
Then save the `id` field of the response. This will be used as the `organizationID` field for the new user.  

### To create a user:
`POST /auth/register` with body containing:  
```JSON
{
  "firstName": "User First Name",
  "lastName": "User Last Name",
  "email": "user@example.com",
  "password": "password123"
}
```
The body of the above request can include a `roleID` field set to `1` to make the new user's role "Administrator" (`2`, the default, is "Member" and has fewer permissions). Example of the body of a registration request for an administrator:  
```JSON
{
  "firstName": "User First Name",
  "lastName": "User Last Name",
  "email": "user@example.com",
  "password": "password123",
  "roleID": 1
}
```

The response will look like this:  
```JSON
{
  "id": 1,
  "message": "User successfully registered"
}
```

### To authenticate a user:
`POST /auth` with body containing:  
```JSON
{
  "email": "user@example.com",
  "password": "password123"
}
```

The response will look like this:  
```JSON
{
  "id": 1,
  "token": "987234.sdf0982347234.hjgsdf89234",
  "message": "Authentication successful"
}
```

Use the bearer token from the response in the `Authorization` header of all requests:  
`Authorization: Bearer 987234.sdf0982347234.hjgsdf89234`

Decode the token with a JWT library to extract the following properties:  
```JSON
{
  "userID": 1,
  "organizationID": 1,
  "roleID": 1
}
```

## HAL
[Hypertext Application Language (HAL)](http://stateless.co/hal_specification.html) is a "simple format that gives a consistent and easy way to hyperlink between resources in your API." It is similar to HATEOAS in that it makes the API explorable by providing links to related entities in each response.  

On the Stockpile API, each response contains a `_links` property that contains several properties. For example, the main endpoint (just `/`) returns:  
```JSON
{
    "_links": {
        "self": {
            "href": "/",
            "method": "GET"
        }
    }
}
```

Currently, support for HAL is broken. The above response should also contain links to all of the other top-level endpoints, allowing the client to explore the API based on the first response. You can track the progress of fixing HAL support in [#70 Fix HAL](https://github.com/AdamVig/stockpile-api/issues/70).  
