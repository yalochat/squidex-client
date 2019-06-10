# Squidex Importer

Squidex importer is a library that allows programmers query, insert and update records on the squidex cms. It takes out the cognitive complexity of the oData syntax.

## Installing

In order to install the squidex importer we need to run the old and reliable:

```
npm install --save @engyalo/squidex-importer
```

## Initializing

Once installed we need to configure an instance of the importer, replace your credentials and urls in the following snnipet:

```
const { SquidexImporter } = require('@engyalo/squidex-importer')
const squidexConnection = {
        squidexId: 'your-client-id',
        squidexSecret: 'your-client-secret',
        squidexAuthEndpoint: 'https://squidex.com/identity-server/connect/token',
        squidexApiBaseUrl: 'https://squidex.com/api/content'
    }

const importer = new SquidexImporter(squidexConnection)
await importer.connect()
```

The _connect_ method negotiates an access token with the identity server, and sets it on this instance once. If the token expires you should call this method again.

## Getting and searching content

After having squidex-importer initialized, you can call the search and get methods like this:

### Get
Gets all the records in a specified table:

```
const result = await importer.get('zero-wing', 'dialogs')
```

Result should be something like:

```
[
    {
        '_id': 123123,
        'name': 'Cats',
        'dialog': 'All your base are belong to us'
    },
    ...
]
```

### Get By Primary key
Gets an specified item by its internal uuid

```
const result = await importer.getByPk('zero-wing', 'dialogs', 'b4f2a773-7a4b-4581-9166-96c4baca6cf8')
```

```
[
    {
        '_id': 123123,
        'name': 'Cats',
        'dialog': 'All your base are belong to us'
    },
]
```

returns -1 if the record was not found

### Search

In a similar way you can search content, using a single field as a filter (usually id):

```
const result = await importer.search('zero-wing', 'dialogs', 'id', 123123)
```

Result should be something like:

```
[
    {
        '_id': 123123,
        'name': 'Cats',
        'dialog': 'All your base are belong to us'
    }
]
```

## Inserting and updating content

After having squidex-importer initialized, you can call the insert and update methods like this:

### Insert
Inserts an object in the specified schema table as long as the field names exists and the validation rules pass.

```
const result = await importer.insert('zero-wing', 'dialogs', {
        'name': 'Cats',
        'dialog': 'All your base are belong to us'
    })
```

### Update
Updates an object in the specified schema table and record id as long as the field names exists and the validation rules pass.


```
const result = await importer.update('zero-wing', 'dialogs', 123123, {
        'name': 'Cats',
        'dialog': 'Your base belong to us'
    })
```
