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
    .add('refreshVisibleSteps (_on_expand)', _.extend(benchProto, {
        fn: function () {
            pg.refreshVisibleSteps();
        }
    }))
    .add('addSteps (position_tour)', _.extend(benchProto, {
        fn: function () {
            pg.addSteps();
        }
    }))
    .add('checkTargets', _.extend(benchProto, {
        fn: function () {
            pg.checkTargets();
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
    var statsToShow = ['hz','rme','samples'];
    var statText = {
        hz: 'Ops/Sec',
        rme: 'Relative MOE',
        samples: 'Runs Sampled'
    };
    var $results = $('#benchmarkResults');
    var ths = [
        $('<th>Test Name</th>')
    ];
    _.each(statsToShow, function (stat) {
        ths.push(
            $('<th/>', {
                text: statText[stat]
            })
        );
    });
    $results.append($('<tr/>').append(ths));

    _.each(self, function (benchmark, i) {
        var tds = [
            $('<td/>', {
                class: 'name',
                text: benchmark.name
            })
        ];
        _.each(statsToShow, function (stat) {
            tds.push(
                $('<td/>', {
                    class: stat,
                    text: 'ready'
                })
            );
        });
        var $tr = $('<tr/>', {
            id: ('result-' + (i + 1))
        }).append(tds);
        $results.append($tr);

        if (benchmark.events.start == null) {
            benchmark.events.start = [];
        }
        benchmark.events.start.push(function (b) {
            $tr.find('td:not(.name)').text('running...');
        });
    });

    self.on('start', function (event) {
        $('.runSuite').text('running...')
            .attr('disabled', 'disabled');
    })
    .on('cycle', function (event) {
        var stats = {
            'hz': Benchmark.formatNumber(event.target.hz.toFixed(event.target.hz < 100 ? 2 : 0)),
            'samples': event.target.stats.sample.length,
            'rme': '\xb1' + event.target.stats.rme.toFixed(2) + '%'
        };
        var $row = $results.find('#result-' + event.target.id);
        _.each(statsToShow, function (stat) {
            $row.find('.' + stat).text(stats[stat]);
        });
    })
    .on('complete', function () {
        $('.runSuite').text('Run Suite')
            .removeAttr('disabled');
    });

    $('.runSuite').on('click', function () {
        self.run({'async': true});
    });
};

