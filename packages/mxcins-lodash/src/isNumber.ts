export default function isNumber(input: any): input is number {
  return typeof input === 'number';
}