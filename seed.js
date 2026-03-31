const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const p = await prisma.project.create({
    data: { name: 'pages-databaseguys-sprint4', url: 'http://localhost:4000' }
  })
  console.log(p.id)
}
main()
