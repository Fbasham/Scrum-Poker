import propTypes from 'prop-types'
import ReactTooltip from 'react-tooltip'
import Image from 'next/image'
import { useEffect, useState } from 'react'
/**
 * RoomInfo component
 */
export default function RoomInfo(props) {
  //Since we are using SSR, the below code is necessary to make sure the component is mounted before showing the tooltip
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div
      className={`h-auto w-72 my-4 rounded-lg bg-white border border-[#26374A]`}
      id={props.id}
    >
      <button
        onClick={() =>
          console.log(`Player ${props.playerName} wants out of here!`)
        }
        className="bg-red-600 border border-gray-400 flex justify-center items-center rounded-full mt-1 ml-1 h-8 w-12 my-auto hover:bg-red-700"
      >
        <Image
          src="/leaveRoom.svg"
          alt={props.t.leaveImgAlt}
          width={36}
          height={32}
          data-testid="blank-card-img"
        />
      </button>
      <div className="flex border-b-[#26374A] border-b p-1 text-left">
        <div className="flex-initial w-48">{props.t.roomId}</div>
        <div className="flex-initial w-48 text-right">
          {props.roomId}
          <button
            data-tip
            data-for="copy"
            data-event="click"
            type="button"
            className="w-auto px-2 pt-1 font-display ml-2 text-white bg-[#26374A] hover:bg-[#1C578A] active:bg-[#16446C] focus:bg-[#1C578A] rounded border border-[#091C2D] text-[12px]"
          >
            <Image src="/copy.svg" alt={props.t.copy} width={11} height={11} />
          </button>
          {isMounted && (
            <ReactTooltip
              id="copy"
              effect="solid"
              clickable
              afterShow={() => {
                navigator.clipboard.writeText(props.roomId)
                setTimeout(() => ReactTooltip.hide(), 2000)
              }}
              data-place="top"
              className="font-display font-bold text-xs !bg-[#1A2838] text-white"
            >
              <span>{props.t.copied}</span>
            </ReactTooltip>
          )}
        </div>
      </div>

      <div className="flex p-1">
        <div className="flex-1 w-48">{props.t.playerName}</div>
        <div className="flex-1 w-48 text-right">{props.playerName}</div>
      </div>
      <div className="flex p-1">
        <div className="flex-1 w-48 ">{props.t.playersOnline}</div>
        <div className="flex-1 w-48 text-right">{props.playersOnline}</div>
      </div>
    </div>
  )
}

RoomInfo.defaultProps = {
  id: 'RoomInfo',
  playerName: 'My Name',
  playersOnline: '3',
  roomId: '2f3h9',
  t: {
    roomId: 'Room Id:',
    playerName: 'Player&apos;s Name:',
    playersOnline: 'Players Online:',
    copy: 'Copy',
  },
}

RoomInfo.propTypes = {
  // id of the element for testing if needed
  id: propTypes.string,

  // player's name as entered on the main page
  playerName: propTypes.string,

  // numbers of players online
  playersOnline: propTypes.number,

  // roomId of the room
  roomId: propTypes.string,

  // translations for labels
  t: propTypes.object,
}
