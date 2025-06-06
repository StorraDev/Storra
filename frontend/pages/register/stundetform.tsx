import Button from '@/components/ui/button'
import InputField from '@/components/ui/input'
import Link from 'next/link'
import { useState } from 'react'
import { FaApple } from 'react-icons/fa'
import { FcGoogle } from 'react-icons/fc'

export default function StudentForm(){
    const [usePhone, setUsePhone] = useState(false)
    return(
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
    )
}