import pgClient from "./pg-client";
import sqls from './sqls';
import { randomString } from '../utils';

const pgApiWrapper = async() => {
    const { pgPool } = await pgClient();
    const pgQuery = (text, params = {}) =>
      pgPool.query(text, Object.values(params));

    return {
        taskMainList: async() => {
            const pgResp = await pgQuery(sqls.tasksLatest);
            return pgResp.rows;
        },
        userInfo: async(userId) => {
            console.log('userId', userId);
            const pgResp = await pgQuery(sqls.usersFromIds, { $1: [userId] });
            return pgResp.rows[0];
        },
        usersInfo: async(userIds) => {
            const pgResp = await pgQuery(sqls.usersFromIds, { $1: userIds });
            return userIds.map((userId) => {
                pgResp.rows.find((row) => userId === row.id)
            });
        },
        allUsers: async() => {
            const pgResp = await pgQuery(sqls.allUsers);
            return pgResp.rows;
        },
        userFromAuthToken: async (authToken) => {
            if(!authToken){
                return null;
            }
            const pgResp = await pgQuery(sqls.userFromAuthToken, {
                $1: authToken
            });
            return pgResp.rows[0];
        },
        approachList: async (taskId) => {
            const pgResp = await pgQuery(sqls.approachesForTaskIds, {
                $1: [taskId]
            });
            return pgResp.rows;
        },
        approachLists: async (taskIds) => {
            const pgResp = await pgQuery(sqls.approachesForTaskIds, {
              $1: taskIds,
            });
            return taskIds.map((taskId) =>
              pgResp.rows.filter((row) => taskId === row.taskId)
            );
          },
        tasksInfo: async (taskIds) => {
            console.log('taskIds', taskIds);
            const pgResp = await pgQuery(sqls.tasksFromIds, {
                $1: taskIds,
                $2: null
            });
            console.log('pgResp.rows', pgResp.rows);
            return taskIds.map((taskId) =>
              pgResp.rows.filter((row) => taskId === row.taskId)
            );
        },
        taskInfo: async (taskId) => {
            console.log('taskIds', taskId);
            const pgResp = await pgQuery(sqls.tasksFromIds, {
                $1: [taskId],
                $2: null
            });
            console.log('pgResp.rows', pgResp.rows);
            return pgResp.rows[0];
        },
        tasksByTypes: async (types) => {
            const results = types.map(async (type) => {
                if (type === 'latest') {
                    const pgResp = await pgQuery(sqls.tasksLatest);
                    return pgResp.rows;
                }
                throw Error('Unsupported type');
            });
            return Promise.all(results);
        },
        searchResults: async (searchTerms) => {
            const results = searchTerms.map(async (term) => {
                const pgResp = await pgQuery(sqls.searchResults, {
                    $1: term,
                    $2: null
                });
                return pgResp.rows;
            });
            return Promise.all(results);
        },
        mutators: {
            userCreate: async ({ input }) => {
                const payload = { errors: [] };
                if(input.password.length < 6){
                    payload.errors.push({
                        message: 'Use a stronger password'
                    });
                }
                if(payload.errors.length === 0){
                    const authToken = await randomString();
                    const pgResp = await pgQuery(sqls.userInsert, {
                        $1: input.username.toLowerCase(),
                        $2: input.password,
                        $3: input.firstName,
                        $4: input.lastName,
                        $5: authToken
                    });
                    if(pgResp.rows[0]){
                        payload.user = pgResp.rows[0];
                        payload.authToken = authToken;
                    }
                }
                return payload;
            }
        }
    };
}

export default pgApiWrapper;