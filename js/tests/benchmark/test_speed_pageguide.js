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
            $('.runSuite').removeAttr('disabled');
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
    .add('setup_handlers', _.extend(benchProto, {
        fn: function () {
            pg.setup_handlers();
        }
    }))
    .add('_on_expand', _.extend(benchProto, {
        fn: function () {
            pg._on_expand();
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
    .add('init', _.extend(benchProto, {
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
        var $summary = $('<td/>', {
            class: 'summary',
            text: 'ready'
        });
        var $name = $('<td/>', {
            class: 'name',
            text: benchmark.name
        });
        var $tr = $('<tr/>', {
            id: ('result-' + (i + 1))
        }).append([
            $name,
            $summary
        ]);
        $results.append($tr);
        if (benchmark.events.start == null) {
            benchmark.events.start = [];
        }
        benchmark.events.start.push(function (b) {
            $summary.text('running...');
        });
    });

    self.on('start', function (event) {
        //console.log(event);
        //$('#benchmarkResults .summary').text('running...');
    })
    .on('cycle', function (event) {
        var $row = $results.find('#result-' + event.target.id);
        $row.find('.summary').text(String(event.target));
        console.log(String(event.target));
    })
    .on('complete', function () {
        console.log('complete');
    });

    $('.runSuite').on('click', function () {
        self.run({'async': true});
    });
};

