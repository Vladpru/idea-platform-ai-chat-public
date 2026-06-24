import * as fs from 'fs';
import * as path from 'path';

import { collectVaultFiles } from './collect-vault-files.util';

jest.mock('fs');

const mockedFs = fs as jest.Mocked<typeof fs>;

function makeDirent(name: string, isDir: boolean): fs.Dirent {
  return {
    name,
    isDirectory: () => isDir,
    isFile: () => !isDir,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
    parentPath: '',
    path: '',
  } as unknown as fs.Dirent;
}

describe('collectVaultFiles', () => {
  beforeEach(() => jest.resetAllMocks());

  it('returns empty array when directory does not exist', () => {
    mockedFs.existsSync.mockReturnValue(false);
    expect(collectVaultFiles('/nonexistent')).toEqual([]);
  });

  it('returns .md files in root directory', () => {
    mockedFs.existsSync.mockReturnValue(true);
    (mockedFs.readdirSync as jest.Mock).mockReturnValue([
      makeDirent('note.md', false),
      makeDirent('image.png', false),
    ]);
    expect(collectVaultFiles('/vault')).toEqual([path.join('/vault', 'note.md')]);
  });

  it('skips hidden directories and files', () => {
    mockedFs.existsSync.mockReturnValue(true);
    (mockedFs.readdirSync as jest.Mock).mockReturnValue([
      makeDirent('.obsidian', true),
      makeDirent('.hidden.md', false),
    ]);
    expect(collectVaultFiles('/vault')).toEqual([]);
  });

  it('recurses into subdirectories', () => {
    mockedFs.existsSync.mockReturnValue(true);
    (mockedFs.readdirSync as jest.Mock)
      .mockReturnValueOnce([makeDirent('sub', true)])
      .mockReturnValueOnce([makeDirent('deep.md', false)]);
    expect(collectVaultFiles('/vault')).toEqual([path.join('/vault', 'sub', 'deep.md')]);
  });
});
