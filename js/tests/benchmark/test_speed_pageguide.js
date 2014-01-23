Benchmark.Suite.prototype.setupDisplay = function () {
    var self = this;
    var $results = $('#benchmarkResults');
    console.log('asdf');
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
    })
    .on('complete', function () {
        console.log('complete');
    });
};

$(function () {
$(document).ready(function () {
$('#test_element').load('../../../example/index.html #exampleContent', function () {
    var pgSuite = new Benchmark.Suite('Pageguide Speed Suite');

    pgSuite.add('open', function () {
        ['asdf','jhfghdfgh',45,'ghfgh','8905830945830','sdfsdfgsdfg',null,6].indexOf(6);
    })
    .add('opensdfgsdf', function () {
        ['asdf','jhfghdfgh',45,'ghfgh','8905830945830','sdfsdfgsdfg',null,6].indexOf(6);
    });

    pgSuite.setupDisplay();
    pgSuite.run();

});
});
}(jQuery));

