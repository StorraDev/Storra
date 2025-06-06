import LoginAuth from '@/components/LoginLayout'
import Button from '@/components/ui/button'
import InputField from '@/components/ui/input'
import Head from 'next/head'
import Link from 'next/link'
import { FaApple } from 'react-icons/fa'
import { FcGoogle } from 'react-icons/fc'

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Login - Storra Learning Platform</title>
        <meta
          name='description'
          content='Create your account on Storra - Join our gamified learning platform and start your educational journey today.'
        />
        <meta property='og:title' content='Login - Storra Learning Platform' />
        <meta
          property='og:description'
          content='Create your account on Storra - Join our gamified learning platform and start your educational journey today.'
        />
        <meta property='og:type' content='website' />
        <meta property='og:url' content='https://storra.com/register' />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content='Login - Storra Learning Platform' />
        <meta
          name='twitter:description'
          content='Create your account on Storra - Join our gamified learning platform and start your educational journey today.'
        />
        <link rel='canonical' href='https://storra.com/register' />
      </Head>
      <LoginAuth>
        <main className='flex flex-col justify-center items-center w-full'>
          <div className='w-10/12 max-w-2xl max-sm:w-full flex flex-col gap-8'>
            <h1 className='text-2xl md:text-4xl lg:text-3xl font-bold capitalize'>
              login to your account
            </h1>
            <form className='w-full flex flex-col gap-5'>
              <InputField
                label='email'
                name='email'
                placeholder='e.g joedoe@mail.com'
              />
              <InputField
                label='password'
                name='password'
                placeholder='e.g ********'
                type='password'
              />

              <button
                type='button'
                className='flex justify-end items-end ml-auto text-blue capitalize'
              >
                forget password?
              </button>

              <Button
                type='submit'
                variant='default'
                size='lg'
                className='rounded-4xl'
              >
                Login
              </Button>
            </form>

            <div className='w-full text-center flex flex-col justify-center items-center gap-8 pt-[2rem]'>
              <div className='flex items-center justify-center w-full'>
                <div className='flex-grow border-t border-gray-200' />
                <span className='mx-4 text-sm text-gray-400'>
                  Or Sign in with
                </span>
                <div className='flex-grow border-t border-gray-200' />
              </div>

              <div className='grid grid-cols-2 gap-5 w-full'>
                <Button
                  variant='ghost'
                  type='button'
                  size='lg'
                  className='rounded-4xl gap-2'
                >
                  <FcGoogle className='text-lg' />
                  Google
                </Button>
                <Button
                  variant='ghost'
                  type='button'
                  size='lg'
                  className='rounded-4xl gap-2'
                >
                  <FaApple className='text-lg' />
                  Apple
                </Button>
              </div>

              <p className='text-sm text-gray-500'>
                Don&apos; t have an account?{' '}
                <Link
                  href='/register'
                  className='text-blue-600 hover:underline font-medium'
                >
                  Signup
                </Link>
              </p>
            </div>
          </div>
        </main>
      </LoginAuth>
    </>
  )
}
