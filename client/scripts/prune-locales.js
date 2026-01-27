import fs from 'fs'
import path from 'path'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default async (context) => {
  const dir = path.join(context.appOutDir, 'locales')
  if (!fs.existsSync(dir)) return

  for (const file of fs.readdirSync(dir)) {
    if (file !== 'en-US.pak') {
      fs.unlinkSync(path.join(dir, file))
    }
  }
}
