angular.module('app').controller("ApiController", ["$scope", "Kong", "$location", "$routeParams", "Alert", "api", function ($scope, Kong, $location, $routeParams, Alert, api) {
    if ($routeParams.id) {
        $scope.api = api;
        $scope.title = "Editar API";
        $scope.action = "Salvar";  // "Save";
        if (api.hosts && angular.equals({}, api.hosts)) { api.hosts = '';}
        if (api.uris && angular.equals({}, api.uris)) { api.uris = '';}
        if (api.methods && angular.equals({}, api.methods)) { api.methods = '';}
    } else {
        $scope.title = "Adicionar API";
        $scope.action = "Adicionar";  // = "Create";
        // default values on API creation
        $scope.api = {
            strip_uri: true,
            preserve_host: false,
            retries: 5,
            upstream_connect_timeout: 60000,
            upstream_send_timeout: 60000,
            upstream_read_timeout: 60000,
            https_only: false,
            http_if_terminated: true
        };
    }

    $scope.save = function () {
        Kong.put('/apis', $scope.api).then(function () {
            if ($routeParams.id) {
                Alert.success('Api atualizada');
            } else {
                Alert.success('Api adicionada');
                // clearing inputs.
                $scope.api = {};
            }
            // clearing errors.
            $scope.error = {};
        }, function (response) {
            $scope.error = response.data;
        });
    }
}]);
