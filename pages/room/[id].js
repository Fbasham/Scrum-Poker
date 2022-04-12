import PropTypes, { number } from 'prop-types'
import { useState, useEffect } from 'react'
import Card from '../../components/Card'
import RoomInfo from '../../components/RoomInfo'
import ChatRoom from '../../components/ChatRoom'
import UserList from '../../components/UserList'
import { useSubscription, useMutation } from '@apollo/client'
import GET_ROOM from '../../graphql/queries/getRoom.graphql'
import USER_SUBSCRIPTION from '../../graphql/subscriptions/user.graphql'
import ROOM_SUBSCRIPTION from '../../graphql/subscriptions/room.graphql'
import UPDATE_USER from '../../graphql/mutations/updateUser.graphql'
import UPDATE_ROOM from '../../graphql/mutations/updateRoom.graphql'
import { useRouter } from 'next/router'
import en from '../../locales/en'
import fr from '../../locales/fr'
import client from '../../graphql/client.js'
import Cookies from 'js-cookie'
import { cards } from '../../utils/cards'

export default function Room(props) {
  const t = props.locale === 'en' ? en : fr
  const router = useRouter()
  const [updatedUser] = useMutation(UPDATE_USER)
  const [updateRoom] = useMutation(UPDATE_ROOM)
  const [room, setRoom] = useState(props.room)
  const [users, setUsers] = useState(props.users)
  const [userId, setUserId] = useState(null)
  const getUserById = (userId) => {
    return users.find((user) => {
      return user.id === userId
    })
  }

  const filteredCards = cards.filter((card) =>
    props.room.cards.includes(card.value)
  )

  const exampleMessages = [
    {
      id: '1',
      name: 'Yoda',
      message: 'You must unlearn what you have learned',
    },
    {
      id: '2',
      name: getUserById(userId)?.name,
      message: 'All right. I’ll give it a try',
    },
    { id: '3', name: 'Yoda', message: 'No. Try not.' },
    { id: '4', name: 'Yoda', message: 'Do… or do not.' },
    { id: '5', name: 'Yoda', message: 'There is no try' },
  ]

  const handleClear = (e) => {
    e.preventDefault()

    //Loop through users in room and set their cards to null
    try {
      users.forEach((user) => {
        updatedUser({
          variables: {
            userInput: {
              id: user.id,
              name: user.name,
              card: null,
              room: user.room,
            },
          },
        })
      })

      //Update the room so isShown is false
      updateRoom({
        variables: {
          updateRoomId: room.id,
          updateRoomUsers: room.userIds,
          isShown: false,
          cards: room.cards,
          timer: {
            timestamp: null,
            duration: null,
          },
        },
      })
    } catch (e) {
      //Something went wrong
      console.log(e)
    }
  }

  useEffect(() => {
    const currCookie = Cookies.get('userid')
    // Check if browser has userid cookie.
    if (!currCookie) {
      router.push({
        pathname: `/home`,
        query: `errorcode=309`,
      })
    } else {
      // Check if userID cookie is in the room.
      const userIsInRoom = getUserById(currCookie)
      if (!userIsInRoom) {
        router.push({
          pathname: `/home`,
          query: `errorcode=310`,
        })
      }

      // User is in this room.
      setUserId(currCookie)
    }
  }, [])

  //User subscription and useEffect to update users
  const userSubscription = useSubscription(USER_SUBSCRIPTION, {
    variables: { room: props.roomId },
  })
  useEffect(() => {
    if (userSubscription.loading) {
      //Do nothing
    }
    if (userSubscription.error) {
      //TODO: Handle error
    }
    if (userSubscription.data) {
      let userFound = false
      let updatedUsers = users.map((user) => {
        if (user.id === userSubscription.data.userModified.id) {
          userFound = true
          return userSubscription.data.userModified
        }
        return user
      })
      if (!userFound) {
        updatedUsers = [...updatedUsers, userSubscription.data.userModified]
      }
      setUsers(updatedUsers)
    }
  }, [userSubscription])

  //Room subscription and useEffect to update room
  const roomSubscription = useSubscription(ROOM_SUBSCRIPTION, {
    variables: { room: props.roomId },
  })
  useEffect(() => {
    if (roomSubscription.data) {
      const { roomUpdated } = roomSubscription.data
      const updatedRoomData = {
        id: roomUpdated.id,
        host: roomUpdated.host.id,
        userIds: roomUpdated.users.map((user) => {
          return user.id
        }),
        isShown: roomUpdated.isShown,
        timer: roomUpdated.timer,
        cards: roomUpdated.cards,
      }
      const now = Date.now()

      console.log('updatedRoomData', updatedRoomData)

      setRoom(updatedRoomData)
    }
  }, [roomSubscription])

  const onCardClickHandler = async (e, card) => {
    const updatedUserData = {
      id: Number(getUserById(userId).id),
      name: getUserById(userId)?.name,
      card: card.value,
      room: getUserById(userId)?.room,
    }
    try {
      const updateUserRes = await updatedUser({
        variables: {
          userInput: updatedUserData,
        },
      }).catch((e) => {
        throw e
      })
    } catch (e) {
      console.log(e)
    }
  }
  return (
    <div id="homeContent" className="container mx-auto my-5 rounded-lg">
      {/* Main 'row' */}
      <div className="flex w-full flex-col space-y-3 lg:space-y-0 lg:flex-row px-2">
        {/* Left Column */}
        <div className="w-full lg:w-4/5 lg:mr-2 border-2 rounded-md">
          {!getUserById(userId)?.card ? (
            <h2 className="border-b-2 p-2 bg-gray-200 mx-auto font-semibold font-body text-center text-lg text-slate-700">
              Welcome to Scrum Poker!
            </h2>
          ) : (
            <h2 className="flex justify-center border-b-2 p-2 bg-gray-200 mx-auto font-semibold font-body text-lg text-slate-700">
              Value selected:{' '}
              <span className="font-bold px-1">
                {getUserById(userId)?.card === 1000 ? (
                  <span className="inline-block font-bold"> 0.5 </span>
                ) : getUserById(userId)?.card === 1001 ? (
                  <span className="inline-block font-bold"> ? </span>
                ) : getUserById(userId)?.card === 1002 ? (
                  <span className="inline-block font-bold text-3xl -translate-y-1">
                    {' '}
                    ∞{' '}
                  </span>
                ) : (
                  getUserById(userId)?.card
                )}
              </span>
            </h2>
          )}

          {/* Cards box */}
          <div className="p-4 pb-1">
            <ul
              id="cards"
              className="grid grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 gap-2"
            >
              {filteredCards.map((card) => {
                return (
                  <li key={card.id}>
                    <Card
                      src={card.src}
                      id={card.id}
                      alt={card.alt}
                      onClick={(e) => onCardClickHandler(e, card)}
                      onKeyDown={(e) => {
                        if (e.keyCode === 32 || e.keyCode === 13) {
                          onCardClickHandler(e, card)
                        }
                      }}
                      selected={card.value === getUserById(userId)?.card}
                    />
                  </li>
                )
              })}
            </ul>
          </div>
          {userId == room.host ? (
            <div className="flex justify-center">
              {!room.isShown ? (
                <button
                  type="button"
                  className="w-1/5 m-5 font-display text-white bg-[#26374A] hover:bg-[#1C578A] active:bg-[#16446C] focus:bg-[#1C578A] py-2 px-2 rounded border border-[#091C2D] text-[16px] leading-8"
                  onClick={() =>
                    updateRoom({
                      variables: {
                        updateRoomId: room.id,
                        updateRoomUsers: room.userIds,
                        isShown: true,
                        timer: {
                          timestamp: room.timer.timestamp,
                          duration: room.timer.duration,
                        },
                        cards: room.cards,
                      },
                    })
                  }
                >
                  {t.showCards}
                </button>
              ) : (
                <button
                  type="button"
                  className="w-1/5 m-5 font-display text-white bg-[#26374A] hover:bg-[#1C578A] active:bg-[#16446C] focus:bg-[#1C578A] py-2 px-2 rounded border border-[#091C2D] text-[16px] leading-8"
                  onClick={() =>
                    updateRoom({
                      variables: {
                        updateRoomId: room.id,
                        updateRoomUsers: room.userIds,
                        isShown: false,
                        timer: {
                          timestamp: room.timer.timestamp,
                          duration: room.timer.duration,
                        },
                        cards: room.cards,
                      },
                    })
                  }
                >
                  {t.hideCards}
                </button>
              )}
              <button
                type="button"
                className="w-1/5 m-5 font-display text-white bg-[#26374A] hover:bg-[#1C578A] active:bg-[#16446C] focus:bg-[#1C578A] py-2 px-2 rounded border border-[#091C2D] text-[16px] leading-8"
                onClick={handleClear}
              >
                {t.clearCards}
              </button>
            </div>
          ) : null}
          {/* User list */}
          <UserList
            t={t}
            userList={users}
            isShown={room.isShown}
            currPlayer={getUserById(userId)}
            host={room.host}
          />
        </div>

        {/* Right Col */}
        <div className="w-full lg:pt-0 lg:w-1/5">
          <div>
            <RoomInfo
              id="roomid"
              t={t}
              roomId={props.roomId}
              playerName={getUserById(userId)?.name}
              playersOnline={users.length}
              roomData={room}
              updateRoom={updateRoom}
              isHost={userId == room.host}
            />
          </div>

          <div>
            <ChatRoom
              id="chat"
              name={getUserById(userId)?.name}
              messages={exampleMessages}
              t={t}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps({ params, locale }) {
  const roomId = params.id

  const langToggleLink =
    locale === 'en' ? '/fr/room/' + params.id : '/room/' + params.id

  /* Place-holder Meta Data Props */
  const meta = {
    data_en: {
      title: 'Room - Scrum Poker',
      desc: 'English',
      author: 'DTS',
      keywords: '',
    },
    data_fr: {
      title: 'Salle - Scrum Poker',
      desc: 'Français',
      author: 'DTS',
      keywords: '',
    },
  }

  //TODO: fetch room data from roomId
  const queryResponse = await client.query({
    query: GET_ROOM,
    variables: { roomsId: roomId },
  })
  const roomInfo = queryResponse.data?.rooms[0]
  // Check if room exists
  if (!roomInfo) {
    return {
      redirect: {
        permanent: false,
        destination: '/home?errorcode=308',
      },
    }
  }
  const room = {
    id: roomInfo.id,
    host: roomInfo.host.id,
    userIds: roomInfo.users.map((user) => {
      return user.id
    }),
    isShown: roomInfo.isShown,
    timer: roomInfo.timer,
    cards: roomInfo.cards,
  }

  const users = roomInfo.users

  return {
    props: { roomId, meta, locale, langToggleLink, room, users },
  }
}

Room.propTypes = {
  /**
   * current locale in the address
   */
  roomId: PropTypes.string,
}
