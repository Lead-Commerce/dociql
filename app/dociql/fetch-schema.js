const graphql = require('graphql')
const request = require("sync-request")

const converter = require('graphql-2-json-schema');
const { filter } = require('bluebird');

const IGNORE = 'IGNORE INTROSPECTION';

const filterFields = (fields) => {
    if (fields !== null) {
        return fields.filter(field => {
            if (field.description) {
                return !field.description.includes(IGNORE);
            }
            return true;
        })
    }
    return null;
}

module.exports = function (graphUrl) {

    const requestBody = {
        query: graphql.introspectionQuery
    };

    const responseBody = request("POST", graphUrl, {
        json: requestBody
    }).getBody('utf8');

    const introspectionResponse = JSON.parse(responseBody);

    // Filter out types marked for ignore
    introspectionResponse.data.__schema.types = introspectionResponse.data.__schema.types
    .filter(type => {
        return !type.description.includes(IGNORE)
    })
    .map(object => {
        // Filter out fields and inputFields marked for ignore
        return {
            ...object,
            fields: filterFields(object.fields),
            inputFields: filterFields(object.inputFields),
        };
    });
    
    // DEBUGGING
    /* introspectionResponse.data.__schema.types.map((object, index) => {
        if (object.name === 'OrderByUserInput') {
            console.log(object);
        }
    }); */

    const jsonSchema = converter.fromIntrospectionQuery(introspectionResponse.data);
    const graphQLSchema = graphql.buildClientSchema(introspectionResponse.data, { assumeValid: true});

    return {
        jsonSchema,
        graphQLSchema
    }
}