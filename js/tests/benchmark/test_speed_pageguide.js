$(function () {
$(document).ready(function () {
$('#test_element').load('../../../example/index.html #exampleContent', function () {
    var pgSuite = new Benchmark.Suite('Pageguide Speed Suite');

    pgSuite.add('open', function () {
        ['asdf','jhfghdfgh',45,'ghfgh','8905830945830','sdfsdfgsdfg',null,6].indexOf(6);
    })
    .on('cycle', function (event) {
        console.log(String(event.target));
    })
    .on('complete', function () {
        console.log('complete');
    });

    console.log(suite);
});
});

}(jQuery));

