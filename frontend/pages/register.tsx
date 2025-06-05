import AuthLayout from '@/components/AuthLayout'
import Button from '@/components/ui/button'
import InputField from '@/components/ui/input'
import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { FaApple } from 'react-icons/fa'
import { FcGoogle } from 'react-icons/fc'
import { IoIosArrowRoundBack } from 'react-icons/io'

export default function Register() {
  const [userType] = useState<'student' | 'parent' | 'teacher'>('student')
  const [usePhone, setUsePhone] = useState(false)

  return (
    <>
      <Head>
        <title>Register - Storra Learning Platform</title>
        <meta
          name='description'
          content='Create your account on Storra - Join our gamified learning platform and start your educational journey today.'
        />
        <meta
          property='og:title'
          content='Register - Storra Learning Platform'
        />
        <meta
          property='og:description'
          content='Create your account on Storra - Join our gamified learning platform and start your educational journey today.'
        />
        <meta property='og:type' content='website' />
        <meta property='og:url' content='https://storra.com/register' />
        <meta name='twitter:card' content='summary_large_image' />
        <meta
          name='twitter:title'
          content='Register - Storra Learning Platform'
        />
        <meta
          name='twitter:description'
          content='Create your account on Storra - Join our gamified learning platform and start your educational journey today.'
        />
        <link rel='canonical' href='https://storra.com/register' />
      </Head>
      <AuthLayout>
        {' '}
        <main className='flex flex-col gap-5 h-full w-full items-center justify-center'>
          <Button
            type='button'
            variant='ghost'
            className='p-2 h-12 w-12 mr-auto rounded-full text-3xl'
          >
            <IoIosArrowRoundBack />
          </Button>
          {userType === 'student' && (
            <div className='w-10/12 max-w-2xl max-sm:w-full flex flex-col gap-7'>
              <h1 className='text-2xl font-bold capitalize'>Student account</h1>
              <form className='w-full flex flex-col gap-5'>
                <InputField
                  label='full name'
                  name='full_name'
                  placeholder='e.g Joe Rayo'
                />
                <div className='space-y-1'>
                  {usePhone ? (
                    <InputField
                      label='Phone Number'
                      name='phone'
                      type='tel'
                      placeholder='e.g. +2348012345678'
                    />
                  ) : (
                    <InputField
                      label='Email'
                      name='email'
                      type='email'
                      placeholder='e.g. storra@gmail.com'
                    />
                  )}

                  <button
                    type='button'
                    onClick={() => setUsePhone((prev) => !prev)}
                    className='text-blue text-sm hover:underline'
                  >
                    {usePhone
                      ? 'Use email instead'
                      : 'Use phone number instead'}
                  </button>
                </div>
                <InputField
                  label='password'
                  name='password'
                  placeholder='e.g ********'
                />
                <InputField
                  label='parent contant (if under 18)'
                  name='patent_contact'
                  placeholder='e.g Parental password if under 18'
                />

                <div className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    id='terms'
                    name='terms'
                    className='w-4 h-4 rounded-lg border-gray'
                    required
                  />
                  <label htmlFor='terms' className='text-sm text-gray-400'>
                    I hereby agree to the{' '}
                    <Link
                      href='/terms'
                      className='text-blue-600 hover:underline'
                    >
                      Terms & Conditions
                    </Link>
                  </label>
                </div>
                <Button
                  type='submit'
                  variant='default'
                  size='lg'
                  className='rounded-4xl'
                >
                  create my account
                </Button>
              </form>

              <div className='w-full text-center flex flex-col justify-center items-center gap-8 pt-[2rem]'>
                <div className='flex items-center justify-center w-full'>
                  <div className='flex-grow border-t border-gray-200' />
                  <span className='mx-4 text-sm text-gray-400'>
                    Or Sign Up with
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
                  Already have an account?{' '}
                  <Link
                    href='/login'
                    className='text-blue-600 hover:underline font-medium'
                  >
                    Login
                  </Link>
                </p>
              </div>
            </div>
          )}

          {userType === 'parent' && (
            <div className='w-10/12 max-w-2xl max-sm:w-full flex flex-col gap-7'>
              <h1 className='text-2xl font-bold capitalize'>parent account</h1>
              <form className='w-full flex flex-col gap-5'>
                <InputField
                  label='full name'
                  name='full_name'
                  placeholder='e.g Joe Rayo'
                />

                <div className='space-y-1'>
                  {usePhone ? (
                    <InputField
                      label='Phone Number'
                      name='phone'
                      type='tel'
                      placeholder='e.g. +2348012345678'
                    />
                  ) : (
                    <InputField
                      label='Email'
                      name='email'
                      type='email'
                      placeholder='e.g. storra@gmail.com'
                    />
                  )}

                  <button
                    type='button'
                    onClick={() => setUsePhone((prev) => !prev)}
                    className='text-blue text-sm hover:underline'
                  >
                    {usePhone
                      ? 'Use email instead'
                      : 'Use phone number instead'}
                  </button>
                </div>

                <InputField
                  label='password'
                  name='password'
                  placeholder='e.g ********'
                />

                <div className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    id='terms'
                    name='terms'
                    className='w-4 h-4 rounded-lg border-gray'
                    required
                  />
                  <label htmlFor='terms' className='text-sm text-gray-400'>
                    I am a parent/guardian
                  </label>
                </div>

                <div className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    id='terms'
                    name='terms'
                    className='w-4 h-4 rounded-lg border-gray'
                    required
                  />
                  <label htmlFor='terms' className='text-sm text-gray-400'>
                    I hereby agree to the{' '}
                    <Link
                      href='/terms'
                      className='text-blue-600 hover:underline'
                    >
                      Terms & Conditions
                    </Link>
                  </label>
                </div>

                <Button
                  type='submit'
                  variant='default'
                  size='lg'
                  className='rounded-4xl capitalize'
                >
                  create my account
                </Button>
              </form>

              <div className='w-full text-center flex flex-col justify-center items-center gap-8 pt-[2rem]'>
                <div className='flex items-center justify-center w-full'>
                  <div className='flex-grow border-t border-gray-200' />
                  <span className='mx-4 text-sm text-gray-400'>
                    Or Sign Up with
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
                  Already have an account?{' '}
                  <Link
                    href='/login'
                    className='text-blue-600 hover:underline font-medium'
                  >
                    Login
                  </Link>
                </p>
              </div>
            </div>
          )}

          {userType === 'teacher' && (
            <div className='w-10/12 max-w-2xl max-sm:w-full flex flex-col gap-7'>
              <h1 className='text-2xl font-bold capitalize'>teacher account</h1>
              <form className='w-full flex flex-col gap-5'>
                <InputField
                  label='full name'
                  name='full_name'
                  placeholder='e.g Joe Rayo'
                />

                <div className='grid grid-cols-1 lg:grid-cols-2 lg:gap-5 gap-3'>
                  <InputField
                    label='institution name'
                    name='institution_name'
                    placeholder='e.g school name'
                  />
                  <InputField
                    label='role'
                    name='role'
                    placeholder='e.g Teacher'
                  />
                </div>

                <div className='space-y-1'>
                  {usePhone ? (
                    <InputField
                      label='Phone Number'
                      name='phone'
                      type='tel'
                      placeholder='e.g. +2348012345678'
                    />
                  ) : (
                    <InputField
                      label='Email'
                      name='email'
                      type='email'
                      placeholder='e.g. storra@gmail.com'
                    />
                  )}

                  <button
                    type='button'
                    onClick={() => setUsePhone((prev) => !prev)}
                    className='text-blue text-sm hover:underline'
                  >
                    {usePhone
                      ? 'Use email instead'
                      : 'Use phone number instead'}
                  </button>
                </div>
                <InputField
                  label='password'
                  name='password'
                  placeholder='e.g ********'
                />

                <div className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    id='terms'
                    name='terms'
                    className='w-4 h-4 rounded-lg border-gray'
                    required
                  />
                  <label htmlFor='terms' className='text-sm text-gray-400'>
                    I hereby agree to the{' '}
                    <Link
                      href='/terms'
                      className='text-blue-600 hover:underline'
                    >
                      Terms & Conditions
                    </Link>
                  </label>
                </div>

                <Button
                  type='submit'
                  variant='default'
                  size='lg'
                  className='rounded-4xl capitalize'
                >
                  create my account
                </Button>
              </form>

              <div className='w-full text-center flex flex-col justify-center items-center gap-8 pt-[2rem]'>
                <div className='flex items-center justify-center w-full'>
                  <div className='flex-grow border-t border-gray-200' />
                  <span className='mx-4 text-sm text-gray-400'>
                    Or Sign Up with
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
                  Already have an account?{' '}
                  <Link
                    href='/login'
                    className='text-blue-600 hover:underline font-medium'
                  >
                    Login
                  </Link>
                </p>
              </div>
            </div>
          )}
        </main>
      </AuthLayout>
    </>
  )
}
