// import { extractPrefixedColumns } from '../utils';

const resolvers = {
    SearchResultItem: {
        __resolveType(item){
            if(item.type === 'task'){
                return 'Task';
            }
            if(item.type === 'approach'){
                return 'Approach';
            }
            return null; // GraphQLError is thrown
        },
        },
    Query: {
        currentTime: async() => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const isoString = new Date().toISOString();
                    resolve(isoString.slice(11,19));
                }, 5000);
            }) 
        },

        sumNumbersInRange: (_, { begin, end }) => {
            if(end < begin){
                throw Error(`Invalid range because ${end} < ${begin}`);
            }
            let sum = 0;
            for (let i = begin; i <= end; i++){
                sum += i;
            }
            return sum;
        },

        taskMainList: async (_, __, { loaders }) => {
            return loaders.tasksByTypes.load('latest');
        },

        allUsers: async (_, __, { pgApi }) => {
            return pgApi.allUsers();
        },

        taskInfo: async (_, args, { loaders }) => {
            console.log('args', args);
            return loaders.tasks.load(args.id);
        },

        search: async (_, args, { loaders }) => loaders.searchResults.load(args.term)
    },
    Task: {
        createdAt: (source) => {
            // console.log(source);
            return source.created_at;
        },
        // author: prefixedObject => {
        //     return extractPrefixedColumns({prefixedObject, prefix: 'author'});
        // }
        author: ({userId}, _, { pgApi }) => {
            return pgApi.userInfo(userId);
        },
        tags: (source) => {
            return source.tags.split(',')
        },
        approachList: ({id}, _, {loaders}) => {
            return loaders.approachList.load(id);
        },
    },
    User: {
        name: (source) => {
            return `${source.firstName} ${source.lastName}`;
        },
        id: (source) => {
            return source.author_id ? `${source.author_id}` : `${source.id}`;
        }
    },
    Approach: {
        createdAt: (source) => source.createdAt.toISOString(),
        author: (source, _, { pgApi }) => pgApi.userInfo(source.userId),
        // task: (source, _, { loaders}) => loaders.tasks.load(source.taskId)
        task: (source, _, { pgApi }) => pgApi.taskInfo(source.taskId)
    },
    Mutation: {
        userCreate: async (_, {input}, {mutators}) => {
            return mutators.userCreate({input});
        }
    }
}

module.exports = resolvers;