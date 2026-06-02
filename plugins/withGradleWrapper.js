const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withGradleWrapper = (config, version) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const wrapperPath = path.join(
        config.modRequest.platformProjectRoot,
        'gradle/wrapper/gradle-wrapper.properties'
      );
      if (fs.existsSync(wrapperPath)) {
        let contents = fs.readFileSync(wrapperPath, 'utf-8');
        contents = contents.replace(
          /distributionUrl=.*/g,
          `distributionUrl=https\\://services.gradle.org/distributions/gradle-${version}-bin.zip`
        );
        fs.writeFileSync(wrapperPath, contents);
      }
      return config;
    },
  ]);
};

module.exports = (config, props) => withGradleWrapper(config, props?.version || '8.13');
