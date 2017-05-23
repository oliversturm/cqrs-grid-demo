module.exports = function(o) {
  this.add('role:testing, domain:entity, cmd:createTestData', function(m, r) {
    console.log('creating test data');

    const seneca = this;

    setTimeout(() => {
      function addDays(date, days) {
        date.setDate(date.getDate() + days);
        return date;
      }

      const currentYear = new Date().getFullYear();
      const currentYearStart = () => new Date(currentYear, 0, 1);
      const nextYearStart = () => new Date(currentYear + 1, 0, 1);

      for (var i = 1; i <= m.count; i++) {
        const instance = {
          date1: addDays(
            currentYearStart(),
            Math.floor(Math.random() * 364 + 1)
          ),
          date2: addDays(nextYearStart(), Math.floor(Math.random() * 364 + 1)),
          int1: Math.floor(Math.random() * 100 + 1),
          int2: Math.floor(Math.random() * 100 + 1),
          string: 'Item ' + i
        };

        seneca.act({
          role: 'resolve',
          type: 'command',
          aggregateName: 'entity',
          command: 'create',
          data: instance
        });
      }
    });

    r();
  });
};
