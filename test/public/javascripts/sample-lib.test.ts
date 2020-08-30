import SampleClass from "../../../public/javascripts/sample-lib"

test("sample lib test", () => {
  let sampleClass = new SampleClass("A", 2)
  expect(sampleClass.sampleField1).toBe("A")
  expect(sampleClass.sampleField2).toBe(2)
})
