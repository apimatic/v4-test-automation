<!-- docs key: gettingStarted -->

## Intro

The Swagger Petstore - OpenAPI 3.0 SDK provides access to the [Swagger Petstore - OpenAPI 3.0 REST APIs](https://swagger.io).

This is a sample Pet Store Server based on the OpenAPI 3.0 specification.  You can find out more about
Swagger at [https://swagger.io](https://swagger.io). In the third iteration of the pet store, we've switched to the design first approach!
You can now help us improve the API whether it's by making changes to the definition itself or to the code.
That way, with time, we can improve the API in general, and expose some of the new features in OAS3.

Some useful links:
- [The Pet Store repository](https://github.com/swagger-api/swagger-petstore)
- [The source API definition for the Pet Store](https://github.com/swagger-api/swagger-petstore/blob/master/src/main/resources/openapi.yaml)

## Installation

Add the SDK as a project reference into your solution:

```bash
dotnet add reference <path-to-sdk>/src/SwaggerPetstoreOpenApi30/SwaggerPetstoreOpenApi30.csproj
```

The project takes its build settings from the files around it, so reference it in place.

## Quick Start

### Dependency Injection

Register the client with `IServiceCollection` and resolve it from the container. The `HttpClient` is managed by `IHttpClientFactory`. Configure the client's behavior through `SwaggerPetstoreOpenApi30ClientOptions`.

```csharp
services.AddSwaggerPetstoreOpenApi30Client(options =>
{
    options.PetstoreAuth = "YOUR_API_KEY";
    options.ApiKey = "YOUR_API_KEY";
    options.Environment = ServerEnvironment.Production;
    // TODO: configure more client options here
});
```

### Direct Instantiation

Create the client by passing an `HttpClient` you manage yourself. Configure the client's behavior through `SwaggerPetstoreOpenApi30ClientOptions`.

```csharp
var httpClient = new HttpClient();
// TODO: configure more client options here
var options = new SwaggerPetstoreOpenApi30ClientOptions
{
    PetstoreAuth = "YOUR_API_KEY",
    ApiKey = "YOUR_API_KEY",
    Environment = ServerEnvironment.Production,
};
var client = new SwaggerPetstoreOpenApi30Client(httpClient, options);
```
