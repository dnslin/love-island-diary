import Link from 'next/link'
import { Button } from 'animal-island-ui'
import { EmptyState } from './illustrations'

export function EmptyMemories() {
  return (
    <EmptyState message="还没有照片呢，先写一篇日记配上图片吧">
      <div className="mt-4">
        <Link href="/diary/new">
          <Button type="primary">去写日记</Button>
        </Link>
      </div>
    </EmptyState>
  )
}
