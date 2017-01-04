'use strict';

describe('Service: localStorageBackedVariable', function () {

    // load the service's module
    beforeEach(module('intellogoSDK'));

    // instantiate service
    var LocalStorageBackedVariable;
    beforeEach(inject(function (_LocalStorageBackedVariable_) {
        LocalStorageBackedVariable = _LocalStorageBackedVariable_;
    }));

    it('should save its values in testing mode', function () {
        var foo = LocalStorageBackedVariable.createHolder('foo'),
            bar = LocalStorageBackedVariable.createHolder('bar');
        foo.setValue('fooValue');
        bar.setValue('barValue');

        expect(foo.getValue()).toEqual('fooValue');
        expect(bar.getValue()).toEqual('barValue');
    });

    it('should save its values in non-testing mode', function () {
        function test() {
            var foo = LocalStorageBackedVariable.createHolder('foo'),
                bar = LocalStorageBackedVariable.createHolder('bar'),
                objHolder = LocalStorageBackedVariable.createHolder('obj'),
                arrHolder = LocalStorageBackedVariable.createHolder('arr'),
                numHolder = LocalStorageBackedVariable.createHolder('num'),
                boolHolder = LocalStorageBackedVariable.createHolder('bool'),
                undefHolder= LocalStorageBackedVariable.createHolder('undef'),
                nullHolder = LocalStorageBackedVariable.createHolder('nullHolder');
            var objValue = {
                a: 1,
                b: 'b',
                c: [3, 4, 5],
                d: {
                    e: 7
                }
            },
            arrValue = ['a', 'b', 'c', 'd'],
            numValue = 17,
            boolValue = false,
            undefValue,
            nullValue = null;
            foo.setValue('fooValue');
            bar.setValue('barValue');
            bar.setValue('barValue');

            objHolder.setValue(objValue);
            arrHolder.setValue(arrValue);
            numHolder.setValue(numValue);
            boolHolder.setValue(boolValue);
            undefHolder.setValue(undefValue);
            nullHolder.setValue(nullValue);

            expect(foo.getValue()).toEqual('fooValue');
            expect(bar.getValue()).toEqual('barValue');

            expect(objHolder.getValue()).toEqual(objValue);
            expect(arrHolder.getValue()).toEqual(arrValue);
            expect(numHolder.getValue()).toEqual(numValue);
            expect(boolHolder.getValue()).toEqual(boolValue);
            expect(undefHolder.getValue()).toEqual(undefValue);
            expect(nullHolder.getValue()).toEqual(nullValue);
        }

        window.TEST_MODE = false;
        try {
            test();
        } catch (e) {
            window.TEST_MODE = true;
            throw e;
        }
        window.TEST_MODE = true;
    });
});
