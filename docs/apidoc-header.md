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
  "refreshToken": "987234kjhmnbmbn34987234jkhsdf2374234fedd",
  "message": "Authentication successful"
}
```

Use the access token from the response in the `Authorization` header of all requests:  
`Authorization: Bearer 987234.sdf0982347234.hjgsdf89234`

Decode the token with a JWT library to extract the following properties:  
```JSON
{
  "userID": 1,
  "organizationID": 1,
  "roleID": 1
}
```

### To refresh a token:
Use the refresh token from the authentication response to get new access tokens when they expire every fifteen minutes.  
1. Authenticate the user as shown above. Save the access and refresh tokens from the response.
2. Use the access token in the `Authorization` header of all requests. When a request returns a `401 Unauthorized`, the token is expired.
3. `POST /auth/refresh` with body containing (`userID` can be decoded from the access token as shown above):
  ```JSON
  {
    "userID": 1,
    "refreshToken": "987234kjhmnbmbn34987234jkhsdf2374234fedd"
  }
  ```
4. Save the access token from the response and use it for further requests:
  ```JSON
  {
    "token": "987234.sdf0982347234.hjgsdf89234",
    "message": "Token successfully refreshed"
  }
  ```

## HATEOAS
To be truly RESTful, an API must be discoverable and self-documenting. Track [#70 Fix HATEOAS](https://github.com/AdamVig/stockpile-api/issues/70) to follow progress on the implementation of HATEOAS.  
