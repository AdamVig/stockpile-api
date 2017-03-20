## Authenticating
When the organization does not exist yet:  
`POST /register` with body containing:
```JSON
{"name": "Name of Organization", "email": "org@example.com", "password": "org123"}
```

When the organization already exists:  
`POST /auth` with body containing:
```JSON
{"email": "org@example.com", "password": "org123"}
```

In either situation, you will receive a response like this:  
```JSON
{"id": 1, "token": "987234.sdf0982347234.hjgsdf89234", "message": "organization credentials are valid"}
```

Make all further requests with the following header:  
`Authorization: Bearer 987234.sdf0982347234.hjgsdf89234`

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
