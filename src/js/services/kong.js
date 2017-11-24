/**
 * This factory handles CRUD requests to the backend API.
 */
angular.module('app')
  .factory('Kong', ['$http', '$q', '$cookies', 'Request', 'Alert', function ($http, $q, $cookies, Request, Alert) {
    var config = {
      url : $cookies.getObject('config.url'),
      auth : { type : "no_auth" },
      gelato : $cookies.getObject('config.gelato')
    };

    var factory = {
      config: config,

      handleError: function (response, deferred, muteErrors) {
        if (response && response.data) {
          deferred.reject(response);
          if (response.data.message && !muteErrors) {
            Alert.error(response.data.message);
          }
        } else {
          console.log(response);
          Alert.error("Oops, algo errado aconteceu. Favor atualizar a página.");
          deferred.reject();
        }
      },

      checkConfig: function (config) {
        var url = config.url;
        if (config.auth.type === 'basic_auth') {
          var auth_string = btoa(config.auth.username + ':' + config.auth.password);
          $http.defaults.headers.common['x-kong-authorization'] = 'Basic ' + auth_string;
        } else {
          delete $http.defaults.headers.common['x-kong-authorization'];
        }
        var deferred = $q.defer();
        if (!url) {
          deferred.reject('Sem URL');
          return deferred.promise;
        }

        try {
          Request({
            kong_url: url,
            endpoint: '/',
            method: 'GET'
          }).then(function (response) {
            if (
              response && response.data && response.data.tagline
              && angular.isString(response.data.tagline)
              && (response.data.tagline.toLowerCase() == "welcome to kong" || response.data.tagline.toLowerCase() == "Bem vindo ao Gateway de APIs")
            ) {
              config.kong_version = response.data.version;
              deferred.resolve();
            } else {
              response.data = {message: "Esta URL não é do Gateway de APIs." + response.data.tagline.toLowerCase() };
              deferred.reject(response);
            }
          }, function (response) {
            if (response.status == 511) {
              response.data = {message: 'O Gateway de APIs solicita autenticação.'};
            } else if (response.status == 404) {
              response.data = {message: "Não foi possivel conectar no Gateway de APIs."};
            }
            deferred.reject(response);
          });
        } catch (err) {
          deferred.reject(err);
        }
        return deferred.promise;
      },

      setConfig: function (config) {
        var deferred = $q.defer();
        factory.checkConfig(config).then(function () {
          factory.config = config;
          $cookies.putObject('config.url', factory.config.url, {
            expires: new Date(new Date().getTime() + 1000 * 24 * 3600 * 60) // remember 60 days
          });
          deferred.resolve();
        }, function (response) {
          factory.handleError(response, deferred);
        });
        $cookies.putObject('config.gelato', config.gelato, {
          expires: new Date(new Date().getTime() + 1000 * 24 * 3600 * 60) // remember 60 days
        });
        return deferred.promise;
      }
    };

    ['get', 'delete', 'head'].forEach(function (method) {
      factory[method] = function (endpoint, muteErrors) {
        var deferred = $q.defer();
        try {
          Request({
            kong_url: factory.config.url,
            endpoint: endpoint,
            method: method
          }).then(function (response) {
            deferred.resolve(response.data);
          }, function (response) {
            factory.handleError(response, deferred, muteErrors);
          });
        } catch(err) {
          factory.handleError(err, deferred);
        }
        return deferred.promise;
      };
    });

    ['post', 'put', 'patch'].forEach(function (method) {
      factory[method] = function (endpoint, data) {
        var deferred = $q.defer();
        try {
          Request({
            kong_url: factory.config.url,
            endpoint: endpoint,
            method: method,
            data: data,
          }).then(function (response) {
            deferred.resolve(response.data);
          }, function (response) {
            factory.handleError(response, deferred);
          });
        } catch(err) {
          factory.handleError(err, deferred);
        }
        return deferred.promise;
      };
    });

    return factory;
  }]);
