import randomString from 'randomstring';
import { v5 as uuidv5 } from 'uuid';

const steingbergNamespace = 'ed66da11-5014-4e8a-876d-829007337274';

function generateUniqueVSTID(): string {
	const name = randomString.generate(5);
	const uid = uuidv5(name, steingbergNamespace);
	return uid.replace(/-/gu, '').toUpperCase();
}

function formatBinaryVSTID(uid: string): string {
	const part1 = uid.substring(0, 8);
	const part2 = uid.substring(8, 16);
	const part3 = uid.substring(16, 24);
	const part4 = uid.substring(24);
	return `0x${part1}, 0x${part2}, 0x${part3}, 0x${part4}`;
}

export { generateUniqueVSTID, formatBinaryVSTID };
