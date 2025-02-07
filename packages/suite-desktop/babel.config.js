module.exports = api => {
    api.cache(true);
    return {
        presets: ['next/babel', '@zeit/next-typescript/babel'],
        plugins: [
            [
                'module-resolver',
                {
                    alias: {
                        '^@suite/actions/(.+).useNative$': './src/actions/\\1', // every action file in suite/actions with .useNative extension will be replaced by a file in suite-native/actions directory
                        '^react-native$': 'react-native-web',
                        '^@suite/(.+)': '../../packages/suite/src/\\1', // relative to this project
                        '^@(.+)-views/(.+)': '../../packages/suite/src/views/\\1/\\2',
                        '^@(.+)-components/(.+)': '../../packages/suite/src/components/\\1/\\2',
                        '^@(.+)-actions/(.+)': '../../packages/suite/src/actions/\\1/\\2',
                        '^@(.+)-reducers/(.+)': '../../packages/suite/src/reducers/\\1/\\2',
                        '^@(.+)-config/(.+)': '../../packages/suite/src/config/\\1/\\2',
                        '^@(.+)-constants/(.+)': '../../packages/suite/src/constants/\\1/\\2',
                        '^@(.+)-support/(.+)': '../../packages/suite/src/support/\\1/\\2',
                        '^@(.+)-utils/(.+)': '../../packages/suite/src/utils/\\1/\\2',
                        '^@(.+)-types/(.+)': '../../packages/suite/src/types/\\1/\\2',
                        '^@(.+)-middlewares/(.+)': '../../packages/suite/src/middlewares/\\1/\\2',
                        '^@(.+)-services/(.+)': '../../packages/suite/src/services/\\1/\\2',
                    },
                },
            ],
        ],
    };
};
