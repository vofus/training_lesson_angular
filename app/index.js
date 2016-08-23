var angular = require('angular');
var app = angular.module('app',[]);

app.controller('MainCtrl', MainCtrl);
app.filter('filterByName', filterByName);

/* === CONTROLLERS === */
function MainCtrl($http, $filter, $timeout) {
    var self = this;

    this.state = {
        users: [],
        filterText: '',
        filteredUsers: null,
        selectUser: null,
        pageLimit: null,
        allPages: null,
        currentPage: null,
        pageValue: null
    };

    this.calcPages = function() {
        var arrLength = self.state.filteredUsers.length,
            pageLimit = 10,
            currentPage = 1,
            allPages = Math.ceil(arrLength / pageLimit);
        self.state.allPages = allPages;
        self.state.pageLimit = pageLimit;
        self.state.currentPage = currentPage;
        self.state.pageValue = self.state.filteredUsers.slice((currentPage-1) * pageLimit, currentPage * pageLimit);
    };

    this.pageNavigator = function() {
        var target = window.event.target;

        while (target.tagName !== 'DIV') {
            if (target.tagName === 'BUTTON') {
                var navDirect = target.getAttribute('data-nav');
                nav(navDirect);
                return;
            }
            target = target.parentNode;
        }
        function nav(navDirect) {
            var currentPage = self.state.currentPage,
                allPages = self.state.allPages,
                pageLimit = self.state.pageLimit;

            if (navDirect === 'prev') {
                if (parseInt(currentPage, 10) === 1) return;
                currentPage--;
                self.state.currentPage = currentPage;
                self.state.pageValue = self.state.filteredUsers.slice((currentPage-1) * pageLimit, currentPage * pageLimit);
                self.state.selectUser = self.state.pageValue[0];
                return;
            }
            if (navDirect === 'next') {
                if (parseInt(currentPage, 10) === allPages) return;
                currentPage++;
                self.state.currentPage = currentPage;
                self.state.pageValue = self.state.filteredUsers.slice((currentPage-1) * pageLimit, currentPage * pageLimit);
                self.state.selectUser = self.state.pageValue[0];
                return;
            }
        }
    };

    this.keyupHendler = function() {
        $timeout(function() {
            self.state.filteredUsers = $filter('filterByName')(self.state.users, self.state.filterText);
            self.calcPages();
            self.state.selectUser = self.state.pageValue[0];
        }, 500);
    };

    this.clickRowHandler = function() {
        var target = window.event.target;
        while(target.tagName !== 'TBODY') {
            if(target.tagName === 'TR') {
                var id = parseInt(target.getAttribute('data-select'), 10);
                self.state.selectUser = self.state.filteredUsers.find(function(item) {
                    return item.id === id;
                });
                return;
            }
            target = target.parentNode;
        }
    };

    this.sortBtnsHendler = function() {
        var target = window.event.target,
            self = this;
        var currentPage = 1,
            allPages = self.state.allPages,
            pageLimit = self.state.pageLimit;

        while (!target.classList.contains('sort-btns')) {
            if (target.tagName === 'BUTTON') {
                var sortDirection = target.getAttribute('data-sort');
                sortUsers(sortDirection);
                return;
            }
            target = target.parentNode;
        }
        function sortUsers(sortDir) {
            if(sortDir === 'up') {
                self.state.filteredUsers = $filter('orderBy')(self.state.filteredUsers, 'last_name', false);
                self.state.currentPage = currentPage;
                self.state.pageValue = self.state.filteredUsers.slice((currentPage-1) * pageLimit, currentPage * pageLimit);
                self.state.selectUser = self.state.pageValue[0];
            }
            if(sortDir === 'down') {
                self.state.filteredUsers = $filter('orderBy')(self.state.filteredUsers, 'last_name', true);
                self.state.currentPage = currentPage;
                self.state.pageValue = self.state.filteredUsers.slice((currentPage-1) * pageLimit, currentPage * pageLimit);
                self.state.selectUser = self.state.pageValue[0];
            }
        }
    };

    this.fetchUsers = function() {
        var users = sessionStorage.getItem('users');

        if (users) {
            console.info('Load data from sessionStorage!');
            var usersArr = JSON.parse(users).slice();

            self.state = {
                users: usersArr,
                filteredUsers: usersArr,
                selectUser: usersArr[0]
            };
            self.calcPages();
            return;
        }

        // $http.get('http://dselkirk.getsandbox.com/users')
        $http.get('http://vofus.gq/angular-1000-rows/users.json')
        .success(function(data) {
            console.info('Load data from URL!');
            // var data = data.splice(0, 30),
            var usersArr = data.slice();
            sessionStorage.setItem('users', JSON.stringify(usersArr));
            self.state = {
                users: usersArr,
                filteredUsers: usersArr,
                selectUser: usersArr[0]
            };
            self.calcPages();
        })
        .error(function() {
            self.data = 'Error!!! Не удалось загрузить данные с сервера!';
        });
    };
    this.fetchUsers();
}

/* === HELP FUNCTIONS === */
function filterByName () {
    return function (items, pattern) {
        return items.filter(function (item) {
            var regExp = new RegExp(pattern, 'i');
            return regExp.test(item.first_name);
        });
    };
}