import SampleClass from '../../../public/javascripts/sample-lib'

test('sample lib test', () => {
  const sampleClass = new SampleClass('A', 2)
  expect(sampleClass.sampleField1).toBe('A')
  expect(sampleClass.sampleField2).toBe(2)
})
