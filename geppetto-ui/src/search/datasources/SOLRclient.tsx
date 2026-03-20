import axios from 'axios';

const globalConfiguration:any = {
    "url": "https://solr-dev.virtualflybrain.org/solr/ontology/select",
    "query_settings":
    {
        "q": "$SEARCH_TERM$",
        "defType": "edismax",
        "qf": "label synonym label_autosuggest_ws label_autosuggest_e label_autosuggest synonym_autosuggest_ws synonym_autosuggest_e synonym_autosuggest shortform_autosuggest has_narrow_synonym_annotation has_broad_synonym_annotation",
        "indent": "true",
        "fl": "short_form,label,synonym,id,type,has_narrow_synonym_annotation,has_broad_synonym_annotation,facets_annotation",
        "start": "0",
        "fq": [
            "type:class OR type:individual OR type:property",
            "ontology_name:(vfb)",
            "shortform_autosuggest:VFB* OR shortform_autosuggest:FB* OR is_defining_ontology:true"
        ],
        "rows": "100",
        "wt": "json",
        "bq": "is_obsolete:false^100.0 shortform_autosuggest:VFB*^110.0 shortform_autosuggest:FBbt*^100.0 is_defining_ontology:true^100.0 label_s:\"\"^2 synonym_s:\"\" in_subset_annotation:BRAINNAME^3 short_form:FBbt_00003982^2"
    }
};

let solrConfiguration:any = {
    params: {
        json: {
          params: globalConfiguration.query_settings
        }
    }
}

export function getResultsSOLR ( searchString: string, returnResults: Function, sorter: Function, queryNumber: number, configuration?: any) {
    var url:string = configuration.url;

    if (configuration.url === undefined) {
        url = globalConfiguration.url;
    }
    if (configuration.query_settings !== undefined) {
        solrConfiguration.params.json.params = configuration.query_settings;
    }

    //encode curly brackets
    searchString = searchString.split("{").join("\\{").split("}").join("\\}")

    // hack to clone the object
    let tempConfig:any = JSON.parse(JSON.stringify(solrConfiguration));
    let query:Array<string> = [];
    let searchTerm = searchString.replace("-"," ").replace("+"," ").replace("_"," ").trim();
    for (let key in searchTerm.split(" ")) {
        let token:string = searchTerm.split(" ")[key]
        query.push("(" + token + " OR " + token + "* OR *" + token + " OR *" + token + "*)")
    }
    tempConfig.params.json.params.q = solrConfiguration.params.json.params.q.replace(/\$SEARCH_TERM\$/g, query.join(" AND "));

    axios.get(`${url}`, tempConfig)
        .then(function(response) {
            // Run refining and sorting inline using the custom sorter from configuration
            window.spotlightString = searchString;
            var refinedResults = refineResults(response.data.response.docs, searchString);
            var sortedResults = refinedResults.sort(sorter);
            returnResults("OK", sortedResults, searchString, queryNumber);
        })
        .catch(function(error) {
            console.log('%c --- SOLR datasource error --- ', 'background: black; color: red');
            console.log(error);
            returnResults("ERROR", undefined, searchString, queryNumber);
        })
};

function refineResults(docs: Array<any>, searchString: string): Array<any> {
    var refinedResults:Array<any> = [];
    docs.map(item => {
        if (item.hasOwnProperty("synonym")) {
            item.synonym.map(innerItem => {
                let newRecord:any = {}
                if (innerItem !== item.label) {
                    Object.keys(item).map(key => {
                        switch(key) {
                            case "label":
                                newRecord[key] = innerItem + " (" + item.label + ")";
                                break;
                            case "synonym":
                                break;
                            default:
                                newRecord[key] = item[key];
                        }
                    });
                    if (!refinedResults.includes(newRecord)) {
                        refinedResults.push(newRecord);
                    }
                }
            });
            let newRecord:any = {}
            Object.keys(item).map(key => {
                if (key !== "synonym") {
                    if (key === "label") {
                        newRecord[key] = item[key] + " (" + item["short_form"] + ")";
                    } else {
                        newRecord[key] = item[key];
                    }
                }
            });
            if (!refinedResults.includes(newRecord)) {
                refinedResults.push(newRecord);
            }
        } else {
            let newRecord:any = {}
            Object.keys(item).map(key => {
                if (key === "label") {
                    newRecord[key] = item[key] + " (" + item["short_form"] + ")";
                } else {
                    newRecord[key] = item[key];
                }
            });
            if (!refinedResults.includes(newRecord)) {
                refinedResults.push(newRecord);
            }
        }
    });

    return refinedResults;
}
