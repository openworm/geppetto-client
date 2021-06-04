# Search

## Component dependencies

This component rely on the axios library (version 0.19.2 used/tested at the moment we are writing this).
To be more precise, this dependency is used by the SOLR datasource client and can be avoided if we are interested only in the search component usage and we want to use another datasource or a custom one that does not rely on axios.

## How to use the component

The component needs the following props when initialised:

- datasource (string): this field specify which datasource we want to use. At the moment I am writing this readme the component supports only the SOLR datasource and the CUSTOM.
SOLR is pretty straight forward and use what the name points, CUSTOM refers to a custom function that will pull data from whichever source we want and it will provide this array of objects to the Search component to be processed.

- datasourceConfiguration (json): whatever configuration our datasource client requires.

- searchConfiguration (json): this consists of the following fields.
  - resultMapping: this props has to declare the mapping for the keys "name" and "id". this means we need to provide one key from the results that will be mapped as name (and used to display the results) and also another key that will be used in the clickHandler function (in the case of SOLR the "short_form" key is mapped for the "id") to execute our action.
  - filters: this is an array of objects, they can be of 2 types as per below:

    - type "string" it will filter the results based on the content of the value contained in the key specified.

        {
          "key": "label",
          "filter_name": "Label",
          "type": "string",
          "enabled": true,
        }
    - type "array" it will filter the results based on the presence in the array of the value specified by the key provided.

        {
      "key": "facets_annotation",
      "filter_name": "Classes",
      "type": "array",
      "disableGlobal": true,
      "values": [
        {
          "key": "Anatomy",
          "filter_name": "Anatomy",
          "enabled": true,
        },
        {
          "key": "Class",
          "filter_name": "Class",
          "enabled": true,
        },
        {
          "key": "Entity",
          "filter_name": "Entity",
          "enabled": true,
        },
      ]
    }

  - sorter: this is a function used by the javascript sort function to order the results. We can customise this function to handle the ordering in the way that we prefer.
  
- customDatasourceHandler (function): this field is NOT mandatory and has to be provided in combination with the prop datasource="CUSTOM". If the datasource is the CUSTOM one we can provide with this prop a function that will be used to pull data from our favourite datasource in replacement of the other available already in the component.
For instance, the function below is the SOLRClient implemented, it's very important to highlight that the signature of the custom function will have to be the same as the one here below, so we will need to provide:
- a searchString,
- a returnResults and
- an optional configuration.

Once the data have been pulled successfully we need to call the function returnResults as done in the function refineResults (function used to customise our results before to give them back to the Search component) or for instance like this "resultsHandler("OK", refinedResults, searchString);" where the 1st variable is a string that indicates if the request was successfull or not, the second is the array of objects that represents the result data, the third is the string that we used to produce such results.
If the request was not successfull we can call the same callback function but with the string "ERROR" and the Search component will handle the rest, like we do here "returnResults("ERROR", undefined, searchString);".

```
export function getResultsSOLR ( searchString: string, returnResults: Function, configuration?: any) {
    var url:string = configuration.url;

    if (configuration.url === undefined) {
        url = globalConfiguration.url;
    }
    if (configuration.query_settings !== undefined) {
        solrConfiguration.params.json.params = configuration.query_settings;
    }

    // hack to clone the object
    let tempConfig:any = JSON.parse(JSON.stringify(solrConfiguration));
    tempConfig.params.json.params.q = solrConfiguration.params.json.params.q.replace(/\$SEARCH_TERM\$/g, searchString);

    axios.get(`${url}`, tempConfig)
        .then(function(response) {
            // returnResults("OK", response.data, searchString);
            refineResults(searchString, response.data.response.docs, returnResults);
        })
        .catch(function(error) {
            console.log('%c --- SOLR datasource error --- ', 'background: black; color: red');
            console.log(error);
            returnResults("ERROR", undefined, searchString);
        })
};

function refineResults(searchString, results, resultsHandler) {
    var refinedResults:Array<any> = [];
    results.map(item => {
        let labelInSynonym:boolean = false;
        if (item.hasOwnProperty("synonym")) {
            item.synonym.map(innerItem => {
                let newRecord:any = {}
                Object.keys(item).map(key => {
                    switch(key) {
                        case "label":
                            newRecord[key] = innerItem;
                            break;
                        case "synonym":
                            break;
                        default:
                            newRecord[key] = item[key];
                    }
                });
                refinedResults.push(newRecord);
                if (innerItem === item.label) {
                    labelInSynonym = true;
                }
            });
            if (!labelInSynonym) {
                let newRecord:any = {}
                Object.keys(item).map(key => {
                    if (key !== "synonym") {
                        newRecord[key] = item[key];
                    }
                });
                refinedResults.push(newRecord);
            }
        } else {
            let newRecord:any = {}
            Object.keys(item).map(key => {
                newRecord[key] = item[key];
            });
            refinedResults.push(newRecord);
        }
    });
    resultsHandler("OK", refinedResults, searchString);
}
```


```element
search/showcase/Search
```

## Examples

### Search Example

Example of a simple search.

```
search/showcase/examples/SearchShowcase
```

## Libraries

[@axios](https://www.npmjs.com/package/axios)
[@Material-ui/core](https://www.npmjs.com/package/@material-ui/core)
