## find-related-tests-js [![npm version](https://badge.fury.io/js/find-related-tests-js.svg)](https://badge.fury.io/js/find-related-tests-js)

Sometimes we need not run all unit tests in our project. This library will try to find the related files(i.e import files) of all files changed in current branch.

This library can be an alternate for jest findRelatedTests or jest changedSince with much more flexibility. Here consumers are responsible to map test file for each related source file.

``npm install --save find-related-tests-js``

---

### Usage
1. Provide changeSet i.e files modified in git as input stream. 
2. This library will load and process dependency graph for the application and provide the following three callbacks to identify related test files.

Callbacks: 
* sourceFileModifiedCb(fileName, accumulator) => This will be called if a file name found in changeSet. Use this to map test file for modified source file.
* directDependencyModifiedCb(fileName, accumulator) => This will be called if any of the imports of a file is modified.
* transitiveDependencyModifiedCb(fileName, accumulator) => This will be called if one of transitive dependency is modified.

Accumulator:
* Every callback provides this to add test file name for give source file like `accumulator.add(testFileName)`. The result will be unique so need to not worry about duplicates.

```
// config.js
// mandatory parameters

function mapSourceToTestFiles(sourceFile, accumulator) {
    if (sourceFile.indexOf('.test.js') >= 1) {
        // Add if this is already a test file
        accumulator.add(sourceFile)
        return
    }

    if (sourceFile.indexOf('.js') >= 1) {
        // Map multiple test files for single source file
        accumulator.add(sourceFile.replace(/\.js/, '.test.js'));
        accumulator.add(sourceFile.replace(/\.js/, '.snapshot.js'));
    }
}

module.exports = {
    entryPoint: '/react/sample/App.js',
    searchDir: '/react/sample',
    dependencyExcludeFilter: path => path.indexOf('node_modules') === -1, // Ignore node module from dep graph
    // It is okay to add same file name in multiple callback
    // result will be unique
    sourceFileModifiedCb: mapSourceToTestFiles,
    directDependencyModifiedCb: mapSourceToTestFiles,
    transitiveDependencyModifiedCb: (sourceFile, accumulator) => {
        // This will be called if any transitive dependency is modified
        // A -> B -> C -> D
        // C & D are transitive dependency for A
    },
    outputFile: '/react/temp.txt',
}

```

  


#### Run via command line

To findRelatedTests for staged files in Git

```
git diff --name-only | xargs printf -- "$PWD/%s\n" | find-related-tests-js --configPath $PWD/config.js --entryPoint $PWD/App.js --searchDir $PWD/src --outputFile temp.txt
```

To findRelatedTests for files committed but not pushed 

```
git diff --name-only origin..head | xargs printf -- "$PWD/%s\n" | find-related-tests-js --configPath $PWD/config.js --entryPoint $PWD/App.js --searchDir $PWD/src --outputFile temp.txt
```

If you have not installed this package globally then use ``./node_modules/find-related-tests-js/dist/cli.js`` as executable.


#### Test Runner

Above command will find all related test files and write their path to configured output file.
Run test candidates with required runner 

```yarn jest $(cat temp.txt)```

```mermaid
flowchart TD
    A["Changed Files (Git Diff)"]:::input
    B["CLI Interface"]:::cli
    subgraph "Configuration Loader"
        C1["Config Loader (TS)"]:::config
        C2["Sample Configuration (JS)"]:::config
    end
    D["Core Library / Orchestration Module"]:::core
    subgraph "Dependency Explorer"
        E1["Dependency Explorer (explorer.ts)"]:::explorer
        E2["Tree Processor (tree.ts)"]:::explorer
        E3["Data Model (model.ts)"]:::explorer
    end
    subgraph "Callback Modules"
        F1["sourceFileModifiedCb"]:::callback
        F2["directDependencyModifiedCb"]:::callback
        F3["transitiveDependencyModifiedCb"]:::callback
    end
    G["Test Accumulator"]:::accumulator
    H["Output Writer"]:::output
    subgraph "Tests"
        T1["Test: findRelatedFiles.spec.ts"]:::test
        T2["Test: tree.spec.ts"]:::test
    end

    %% Data Flow
    A -->|"inputs"| B
    B -->|"loads config"| C1
    B -->|"loads config"| C2
    B -->|"initiates"| D
    C1 -->|"provides config"| D
    C2 -->|"provides config"| D
    D -->|"builds dependency graph"| E1
    E1 -->|"uses"| E2
    E1 -->|"uses"| E3
    E1 -->|"triggers"| F1
    E1 -->|"triggers"| F2
    E1 -->|"triggers"| F3
    F1 --> G
    F2 --> G
    F3 --> G
    G -->|"writes test file list"| H

    %% Click Events
    click B "https://github.com/livingston/find-related-tests-js/blob/master/lib/cli.ts"
    click C1 "https://github.com/livingston/find-related-tests-js/blob/master/lib/config.ts"
    click C2 "https://github.com/livingston/find-related-tests-js/blob/master/sampleConfig.js"
    click D "https://github.com/livingston/find-related-tests-js/blob/master/lib/index.ts"
    click E1 "https://github.com/livingston/find-related-tests-js/blob/master/lib/explorer.ts"
    click E2 "https://github.com/livingston/find-related-tests-js/blob/master/lib/tree.ts"
    click E3 "https://github.com/livingston/find-related-tests-js/blob/master/lib/model.ts"
    click T1 "https://github.com/livingston/find-related-tests-js/blob/master/test/findRelatedFiles.spec.ts"
    click T2 "https://github.com/livingston/find-related-tests-js/blob/master/test/tree.spec.ts"

    %% Styles
    classDef input fill:#F9E79F,stroke:#333,stroke-width:2px;
    classDef cli fill:#AED6F1,stroke:#333,stroke-width:2px;
    classDef config fill:#F5B7B1,stroke:#333,stroke-width:2px;
    classDef core fill:#A9DFBF,stroke:#333,stroke-width:2px;
    classDef explorer fill:#FAD7A0,stroke:#333,stroke-width:2px;
    classDef callback fill:#AED6F1,stroke:#333,stroke-width:2px;
    classDef accumulator fill:#D7BDE2,stroke:#333,stroke-width:2px;
    classDef output fill:#F1948A,stroke:#333,stroke-width:2px;
    classDef test fill:#A3E4D7,stroke:#333,stroke-width:2px;
```
