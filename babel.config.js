module.exports = {
  "presets": [
    ['@babel/preset-env',
     { targets: { node: 'current', }, },],
    "@babel/preset-react"
  ],
  "plugins": [
    "@babel/plugin-transform-regenerator",
    "@babel/plugin-proposal-class-properties",
   
    ["module-resolver", {
      "root": ["./"],
      "alias": { "geppetto-client": "./geppetto-client" }
    }]
    
  ],
  "ignore": [".git", /node_modules/, "dist"]
}

