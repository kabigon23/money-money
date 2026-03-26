import { NextResponse } from 'next/server'

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://edition.cnn.com/markets/fear-and-greed',
    'Origin': 'https://edition.cnn.com',
}

export async function GET() {
    try {
        const res = await fetch('https://production.dataviz.cnn.io/index/fearandgreed/graphdata/', {
            headers: HEADERS,
            cache: 'no-store',
        })

        if (!res.ok) {
            throw new Error(`CNN API responded with ${res.status}`)
        }

        const data = await res.json()
        const current = data?.fear_and_greed

        if (!current) {
            throw new Error('Invalid data structure: ' + JSON.stringify(Object.keys(data)))
        }

        return NextResponse.json({
            score: Math.round(current.score),
            rating: current.rating as string,
            timestamp: current.timestamp,
        })
    } catch (error: any) {
        console.error('Fear & Greed fetch error:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
