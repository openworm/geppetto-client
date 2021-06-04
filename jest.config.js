module.exports = {
  verbose: true,
  testRegex: "(__test__/Test.*|(\\.|/)(test|spec))\\.[jt]sx?$",
  moduleNameMapper: { 
    "^@geppettoengine/geppetto-client(.*)$": "<rootDir>/geppetto-client/js$1",
    "^@geppettoengine/geppetto-core(.*)$": "<rootDir>/geppetto-core/src$1",
    "^@geppettoengine/geppetto-ui(.*)$": "<rootDir>/geppetto-ui/src$1" 
  },
  transform: { "^.+\\.(js|jsx|ts|tsx)?$": "babel-jest" },
  transformIgnorePatterns: [
    "node_modules/(?!(@geppettoengine|bezier-js|three)/)",
  ],
  modulePathIgnorePatterns: ["utilities"]
};