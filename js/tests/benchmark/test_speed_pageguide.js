var pg = {};

$(function () {
$(document).ready(function () {
$('#test_element').load('../../../example/index.html #exampleContent', function () {
    var pgSuite = new Benchmark.Suite('Pageguide Speed Suite');
    var benchProto = {
        onError: function (e) {
            console.log(e);
        }
    }

    pg = tl.pg.init({
        ready_callback: function () {
            pgSuite.run();
        }
    });

    pgSuite.add('hashUrl', _.extend(benchProto, {
        fn: function () {
            tl.pg.hashUrl();
        }
    }))
    .add('isScrolledIntoView', _.extend(benchProto, {
        fn: function () {
            tl.pg.isScrolledIntoView('#fourth_element_to_target');
        }
    }))
    .add('_open', _.extend(benchProto, {
        fn: function () {
            pg._open();
        }
    }))
    .add('_close', _.extend(benchProto, {
        fn: function () {
            pg._close();
        }
    }))
    .add('_on_expand', _.extend(benchProto, {
        fn: function () {
            pg._on_expand();
        }
    }))
    .add('setup_handlers', _.extend(benchProto, {
        fn: function () {
            pg.setup_handlers();
        }
    }))
    .add('position_tour', _.extend(benchProto, {
        fn: function () {
            pg.position_tour();
        }
    }))
    .add('show_message', _.extend(benchProto, {
        fn: function () {
            pg.show_message(3);
        }
    }))
    .add('init without welcome', _.extend(benchProto, {
        defer: true,
        fn: function (deferred) {
            pg = tl.pg.init({
                ready_callback: function () {
                    deferred.resolve();
                }
            });
        }
    }));

    pgSuite.setupDisplay();
});
});
}(jQuery));

Benchmark.Suite.prototype.setupDisplay = function () {
    var self = this;
    var $results = $('#benchmarkResults');
    _.each(self, function (benchmark, i) {
        $results.append(
            '<tr id="result-' + (i + 1) + '">' +
                '<td class="summary">ready</td>' +
            '</tr>'
        );
    });

    self.on('cycle', function (event) {
        var $row = $results.find('#result-' + event.target.id);
        $row.find('.summary').text(String(event.target));
        console.log(String(event.target));
    })
    .on('complete', function () {
        console.log('complete');
    });
};

