import img1 from '@/public/img1.jpg'
import img2 from '@/public/img2.jpg'
import img3 from '@/public/img3.jpg'
import img4 from '@/public/img4.jpg'
import { Inter } from 'next/font/google'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { IoLogoLinkedin } from 'react-icons/io'
import {
  RiFacebookBoxFill,
  RiInstagramLine,
  RiTwitterFill,
} from 'react-icons/ri'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const peoplesImg = [img1, img2, img3, img4]

export default function Home() {
  return (
    <>
      <Head>
        <title>
          Storra - Learn, Earn, and Play | Gamified Learning Platform
        </title>
        <meta
          name='description'
          content="Join Storra, the world's first gamified learning and earning platform for students, youth, schools & parents. Transform education into an engaging lifestyle."
        />
        <meta
          property='og:title'
          content='Storra - Learn, Earn, and Play | Gamified Learning Platform'
        />
        <meta
          property='og:description'
          content="Join Storra, the world's first gamified learning and earning platform for students, youth, schools & parents. Transform education into an engaging lifestyle."
        />
        <meta property='og:type' content='website' />
        <meta property='og:url' content='https://storra.com' />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content='Storra - Learn, Earn, and Play' />
        <meta
          name='twitter:description'
          content="Join the world's first gamified learning and earning platform. Transform education into an engaging lifestyle."
        />
        <link rel='canonical' href='https://storra.com' />
      </Head>
      <main className='min-h-screen flex flex-col items-center justify-between gap-8 py-10 relative overflow-hidden '>
        <div className='absolute inset-0 bg-black lg:bg-gradient-to-r lg:from-[#1a3699] lg:via-black lg:to-[#1a3699] z-0'>
          {/* <div className='absolute inset-0 opacity-30'>
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className='absolute rounded-full bg-white'
                style={{
                  width: Math.random() * 2 + 1 + 'px',
                  height: Math.random() * 2 + 1 + 'px',
                  top: Math.random() * 100 + '%',
                  left: Math.random() * 100 + '%',
                  opacity: Math.random() * 0.5 + 0.3,
                }}
              />
            ))}
          </div> */}
        </div>

        <section className='w-full lg:w-[45%] px-4 py-16 flex flex-col items-center gap-8 text-center z-10'>
          <Image
            src='/logo.svg'
            alt='Storra Logo'
            width={150}
            height={150}
            className='w-32 h-32'
          />
          <p className='border-2 border-gray-400 flex justify-center items-center gap-2 text-white rounded-full py-2 px-5'>
            <div className='h-3 w-3 rounded-full bg-blue-500' />
            Get Early Exclusive Access
          </p>

          <h1
            className={`${inter.className} text-4xl md:text-5xl lg:text-6xl text-white leading-tight`}
          >
            Get Ready to Learn, Earn, and Play with Storra
          </h1>

          <p className='text-lg text-gray-300 max-w-xl'>
            Be among the first to experience the world&apos;s first gamified
            learning and earning platform for students, youth, schools &
            parents.
          </p>

          <div className='w-full lg:w-2xl relative'>
            {' '}
            <input
              type='email'
              placeholder='Email address'
              className='rounded-full bg-white text-gray-800 border-0 h-14 w-full px-5 pr-36 truncate'
            />
            <button className='bg-blue-600 hover:bg-blue-700 cursor-pointer text-white rounded-full h-12 px-6 whitespace-nowrap absolute right-1 top-1'>
              Join Wait-list
            </button>
          </div>

          <div className='flex items-center gap-2'>
            <div className='flex -space-x-3'>
              <div className='flex -space-x-3'>
                {peoplesImg.map((imgUrl, i) => (
                  <div
                    key={i}
                    className='w-8 h-8 rounded-full border-2 border-blue-900 overflow-hidden ring-1 ring-white'
                  >
                    <Image
                      src={imgUrl}
                      alt={`User ${i + 1}`}
                      width={32}
                      height={32}
                      className='object-cover object-top h-full'
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className='relative flex items-center'>
              <div className='relative pl-8'>
                <div
                  className='absolute inset-0 border border-gray-500/30'
                  style={{
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    borderTopRightRadius: '9999px',
                    borderBottomRightRadius: '9999px',
                    clipPath: 'polygon(16px 0, 100% 0, 100% 100%, 16px 100%)',
                  }}
                ></div>

                <div className='flex items-center bg-navy-900 bg-opacity-80 pr-6 pl-12 rounded-r-full h-10'>
                  <div className='text-white text-sm font-medium'>
                    People joined already
                  </div>
                </div>
              </div>

              <span
                className='absolute left-0 text-sm flex items-center justify-center bg-blue-600 text-white rounded-full 
              h-10 w-10 z-10 ring-2 ring-white'
              >
                200+
              </span>
            </div>
          </div>
        </section>
        <div className='text-center text-white flex flex-col justify-center items-center gap-1 max-w-3xl mt-auto pt-8 z-10 px-5'>
          <p className='text-lg italic'>
            "Education meets innovation. Learning becomes a lifestyle."
          </p>
          <span className='text-gray-300'>- The Storra Team</span>
        </div>
        <hr className='border-b border-gray-400 z-10 w-4/5 xl:w-3/5 lg:w-3/5 md:w-4/5' />
        <footer className='flex flex-col-reverse w-full lg:flex-row xl:w-3/5 lg:w-3/5 md:w-4/5 py-4 z-10 gap-5 px-5 justify-between items-center'>
          {' '}
          <div className='flex justify-start items-center gap-5 text-xl text-gray-300'>
            <RiInstagramLine className='hover:text-[#E4405F] transition-colors cursor-pointer' />
            <IoLogoLinkedin className='hover:text-[#0A66C2] transition-colors cursor-pointer' />
            <RiFacebookBoxFill className='hover:text-[#1877F2] transition-colors cursor-pointer' />
            <RiTwitterFill className='hover:text-[#1DA1F2] transition-colors cursor-pointer' />
          </div>
          <div className='flex items-center gap-5 text-sm'>
            <Link href='#services'>Terms of Service</Link>
            <Link href='#privacy'>Privacy Policy</Link>
          </div>
        </footer>
      </main>
    </>
  )
}
