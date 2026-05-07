import { render } from '@testing-library/react'
import { CoverDecorations } from '../CoverDecorations'

describe('CoverDecorations', () => {
  it('renders 8 svg elements', () => {
    render(<CoverDecorations />)
    const svgs = document.querySelectorAll('svg')
    expect(svgs.length).toBe(8)
  })

  it('has cloud animation styles', () => {
    render(<CoverDecorations />)
    const clouds = document.querySelectorAll('.cloud-anim')
    expect(clouds.length).toBe(2)
  })

  it('has flower animation styles', () => {
    render(<CoverDecorations />)
    const flowers = document.querySelectorAll('.flower-anim')
    expect(flowers.length).toBe(2)
  })

  it('has heart animation styles', () => {
    render(<CoverDecorations />)
    const hearts = document.querySelectorAll('.heart-anim')
    expect(hearts.length).toBe(2)
  })

  it('has star animation styles', () => {
    render(<CoverDecorations />)
    const stars = document.querySelectorAll('.star-anim')
    expect(stars.length).toBe(1)
  })
})
